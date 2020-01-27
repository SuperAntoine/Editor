import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';
 
@Component({
  selector: 'app-canva',
  templateUrl: './canva.component.html',
  styleUrls: ['./canva.component.scss']
})
export class CanvaComponent implements OnInit {

	@ViewChild('canvas', { static: true })
    canvas: ElementRef<HTMLCanvasElement>;
	canvasElement; //Elément canvas
	ctx: CanvasRenderingContext2D; //Contexte
	
	networkSubscription: Subscription;
	linkingSubscription: Subscription;
	editingSubscription: Subscription;
	editedSubscription: Subscription;
	newElementSubscription: Subscription;
	removingSubscription: Subscription;
	newNetworkSubscription: Subscription;
	convertSubscription: Subscription;
	removeLinkSubscription: Subscription;
	goToLinkSubscription: Subscription;
    jsonSubcription: Subscription;
	
    canvaWidth = 800;
    canvaHeight = 600;
	network: any; //Réseau
	fontSize: number = 10; //Taille de la police
	circles: any[]; //Liste des cercles
	nextCircleId: number; //Prochain id de cercle
	selected: number; //Vaut l'index du cercle sélectionné, -1 sinon
	down: boolean = false; //Vrai s'il y a clique
	previous: number[]; //Position précédente de la souris
	linking: boolean; //Vaut vrai si un lien est entrain d'être créé
	linkingFrom: number; //Origine du lien
	links: any[]; //Liste des liens
	editing: boolean; //Vaut vrai si on est entrain d'édier
	removing: boolean; //Vaut vrai si on est entrain de supprimer
	nextLinkId: number; //Prochain id de lien
	loops: any[]; //Liste des boucles 
	nextLoopId: number; //Prochain id de boucle
	zoom: number; //Zoom actuel
	baseRadius = 10; //Rayon de base d'un cercle
	nextBridgeId: number;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {		
		this.canvasElement = document.querySelector('canvas');
		//Récupération du contexte
		this.ctx = this.canvas.nativeElement.getContext('2d');
		this.ctx.textAlign = 'center';
		
		this.newNetwork();
		//Ajout d'événements de la souris
		const y = this;
		
		//Détection du click
		document.body.onmousedown = function() {
			y.down = true;
		};
		document.body.onmouseup = function() {
			y.down = false;
		}
		
		//Gestion du zoom avec la molette
		document.body.onwheel = function(event) {
			let shift = -1 * Math.sign(event.deltaY);
			if (shift > 0 || y.fontSize > 2) {
				y.fontSize += shift;
				y.scaleFont();
				y.zoom += shift;
			}
			
			for (let i = 0; i < y.circles.length; i++) 
				if (shift > 0 || y.circles[i].r > 2)
					y.circles[i].r += shift;
				
			let centerX = 0;
			let centerY = 0;
			y.circles.forEach((circle) => {
				centerX += circle.x;
				centerY += circle.y;
			});
			centerX /= y.circles.length;
			centerY /= y.circles.length;
				
			for (let i = 0; i < y.circles.length; i++) {
				const circle = y.circles[i];
				if (shift > 0 || circle.r > 2)
					y.circles[i] = y.moveCircle(circle, centerX, centerY, shift, true);
			}
			y.update();
		}
		
		//Observables
		// Synchronisation du réseau
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
		// Mise à jour de l'état de liaison
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
				if (!linking) {
					this.linkingFrom = -1;
					this.update();
				}
			}
		);
		// Synchronisation de l'état d'édition
		this.networkService.emitLinkingSubject();
		this.editingSubscription = this.networkService.editingSubject.subscribe(
			(editing: boolean) => {
				this.editing = editing;
			}
		);
		this.networkService.emitEditingSubject();
		// Réception de l'élément modifié
		this.editedSubscription = this.networkService.editedSubject.subscribe(
			(elt: any) => {
				if (elt.hasOwnProperty('name')) {
					for (let i = 0; i < this.circles.length; i++) 
						if (this.circles[i].id == elt.id)
							this.circles[i] = elt;
				}
				else {
					for (let i = 0; i < this.links.length; i++) {
						const link = this.links[i];
						if (link.id == elt.id) {
							delete elt.from_name;
							delete elt.to_name;
							this.links[i] = elt;
							if (elt.old_length != elt.length) {
								const circle1 = this.getCircle(link.from);
								const circle2 = this.getCircle(link.to);
								const centerX = (circle1.x + circle2.x) / 2;
								const centerY = (circle1.y + circle2.y) / 2;
								const shift = (elt.length - elt.old_length) / 2;
								const i = this.circles.indexOf(circle1);
								const j = this.circles.indexOf(circle2);
								this.circles[i] = this.moveCircle(circle1, centerX, centerY, shift, false);
								this.circles[j] = this.moveCircle(circle2, centerX, centerY, shift, false);
							}
						}
					}
				}
				this.update();
			}
		);
		// Réception de l'ordre de création d'un nouvel élément
		this.newElementSubscription = this.networkService.newElementSubject.subscribe(
			(type: string) => {
				this.createCircle(this.canvasElement.width/2, this.canvasElement.height/2, type == 'station' ? 4: 50, null, type)
				this.unToggleAll();
				this.update()
			}
		);
		// Synchronisation de l'état de suppression
		this.removingSubscription = this.networkService.removingSubject.subscribe(
			(removing: boolean) => {
				this.removing = removing;
			}
		);
		this.networkService.emitRemovingSubject();
		// Réception de l'ordre de reset du réseau
		this.newNetworkSubscription = this.networkService.newNetworkSubject.subscribe(
			() => {
				y.newNetwork()
			}
		);
		// Réception de l'ordre d'exportation
		this.convertSubscription = this.networkService.convertSubject.subscribe(
			() => {
				y.convertNetwork();
				y.networkService.export();
			}
		);
		// Réception de l'ordre de suppression d'un lien
		this.removeLinkSubscription = this.networkService.removeLinkSubject.subscribe(
			(id: number) => {
				this.removeLink(id);
				this.update();
			}
		);
		// Réception de l'ordre d'édition d'une sections
		this.goToLinkSubscription = this.networkService.goToLinkSubject.subscribe(
			(id: number) => {
				let link;
				this.links.forEach((linkElt) => {
					if (linkElt.id == id)
						link = linkElt;
				});
				if (link.type != 'bridge') {
					link.from_name = this.getCircle(link.from).name;
					link.to_name = this.getCircle(link.to).name;
				}
				link.old_length = link.length;
				this.networkService.editElement(link, []);
			}
		);
        // Importation d'un réseau
        this.jsonSubcription = this.networkService.jsonSubject.subscribe(
            (network) => {
                this.newNetwork();
                this.convertFromNetwork(network);
                this.update();
            }
        );
	}
    
    linkBridge(i: number, j: number, speed: number, loopName: string) {
        const id1 = this.circles[i].id;
        const id2 = this.circles[j].id;
        
        this.circles[i].link = this.nextBridgeId;
        this.circles[i].linked = this.circles[j].id;
        this.circles[i].name = 'switch_out ' + this.circles[i].id;
        this.circles[j].link = this.nextBridgeId++;
        this.circles[j].linked = this.circles[i].id;
        this.circles[j].name = 'switch_in ' + this.circles[j].id;

        this.createLink(id1, id2, speed, true, loopName);
    }
    
    createCircle(x: number, y: number, max_pods: number, name: string, type: string) {
        let elt = {
            id: this.nextCircleId++,
            x: x,
            y: y,
            r: this.baseRadius + this.zoom
        };
        if (type == 'bridge') {
            elt['type'] = 'switch_in';
            this.circles.push(elt);
            
            let elt2 = Object.assign({}, elt);
            elt2['type'] = 'switch_out';
            elt2['id'] = this.nextCircleId++;
            elt2.x += elt.r * 4;
            this.circles.push(elt2);
            
            const n = this.circles.length - 1;
            this.linkBridge(n-1, n, 16.67, null);
        } else {
            elt['name'] = name != null ? name: type + ' ' + this.nextCircleId.toString();
            elt['type'] = type;
            elt['max_pods'] = max_pods;
            if (type == 'station')
                elt['station_type'] = 1;
            this.circles.push(elt);
        }
    }
	
	newNetwork() {
		//Réinitialise le modèle édtieur
		this.selected = -1;
		this.circles = [];
		this.nextCircleId = 0;
		this.links = [];
		this.nextLinkId = 0;
		this.loops = [];
		this.nextLoopId = 0;
		this.zoom = 0;
		this.nextBridgeId = 0;
		this.update();
	}
	
	scaleFont() {
		//Change la police d'écriture
		this.ctx.font = this.fontSize.toString() + 'px serif';
	}
	
	getCircle(id: number) {
		//Renvoie un cercle selon l'id
		for (let i = 0; i < this.circles.length; i++)
			if (this.circles[i].id == id)
				return this.circles[i];
		return null;
	}
	
	getLink(id: number) {
		//Renvoie un lien selon l'id
		for (let i = 0; i < this.links.length; i++)
			if (!this.links[i].bridge && this.links[i].id == id)
				return this.links[i];
		return null;
	}
	
	update() {
		//Mets à jour l'affichage
		this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
		
		//Affichage des cerlces
		this.circles.forEach((circle) => {
			//Couleur
			if (circle.id == this.linkingFrom)
				this.ctx.fillStyle = 'yellow';
			else
				switch(circle.type) {
					case 'station': {
						this.ctx.fillStyle = 'red';
						break;
					}
					case 'shed': {
						this.ctx.fillStyle = 'blue';
						break;
					}
					case 'switch_in':
					case 'switch_out': {
						this.ctx.fillStyle = 'green';
						break;
					}
				}
				
			//Traçage du cercle
			this.ctx.beginPath();
			this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
			this.ctx.stroke();
			this.ctx.fill();
			//Affichage du texte
            if (!this.isSwitch(circle.id)) {
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(circle.name, circle.x, circle.y + circle.r * 2);
                this.ctx.closePath();
            }
		});
		
		//Affichage des liens
		this.links.forEach((link) => {
			let circle1 = this.getCircle(link.from);
			let circle2 = this.getCircle(link.to);
			this.ctx.beginPath();
			//Affichage de la ligne
			this.ctx.moveTo(circle1.x, circle1.y);
			this.ctx.lineTo(circle2.x, circle2.y);
            this.ctx.stroke();
            
            if (!link.bridge) {
                //Calculs
                const angle = this.angle(circle1.x, circle1.y, circle2.x, circle2.y) + 5 * Math.PI / 6;
                let side = 1;
                if (circle2.x < circle1.x)
                    side = -1
                const coef = (20 + this.zoom) * side;
                //Affichage des flèches
                this.ctx.lineTo(circle2.x + Math.cos(angle) * coef, circle2.y + Math.sin(angle) * coef);
                this.ctx.stroke()
                this.ctx.moveTo(circle2.x, circle2.y);
                this.ctx.lineTo(circle2.x + Math.cos(angle + Math.PI/3) * coef, circle2.y + Math.sin(angle + Math.PI/3) * coef);
                this.ctx.stroke();
            }
            
			this.ctx.closePath();
		});
		
		//Affiche des boucles
		this.loops.forEach((loop) => {
			const n = loop.loop.length;
			let centerX = 0;
			let centerY = 0;
			loop.loop.forEach((linkId) => {
				const link = this.getLink(linkId);
				const circle = this.getCircle(link.from);
				centerX += circle.x;
				centerY += circle.y;
			});
			centerX /= n;
			centerY /= n;
			this.ctx.beginPath();
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(loop.name, centerX, centerY);
		});
	}
	
	findLink(id: number) {
		//Renvoie l'indice d'un lien selon l'id
		for (let i = 0; i < this.links.length; i++)
			if (this.links[i].from == id && !this.links[i].bridge)
				return i;
		return -1;
	}
	
	checkForLoops(name: string) {
		//Vérifie s'il faut créer une boucle
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (!link.inLoop && !link.bridge) {
				let stop = false;
				let isLoop = false;
				let links = Object.assign([], this.links);
				let next = link.to;
				let way = [i];
				const id = link.from;
				
				for (let j = 0; j < links.length; j++)
					links[j].checked = false;
				links[i].checked = true;
				
				while (!stop && !isLoop) {
					//On cherche le prochain lien
					const nextLink = this.findLink(next);
					if (nextLink == -1)
						//S'il n'existe pas la boucle n'est pas fermée
						stop = true;
					else if (links[nextLink].checked)
						//Si le lien est déjà marqué, on est revenu au point de départ
						isLoop = true;
					else {
						//Sinon, on ajoute le lien au chemin et on passe au suivant
						way.push(nextLink);
						next = links[nextLink].to;
					}
				}
				if (isLoop) {
					let loop = []
					for (let j of way) {
						this.links[j].inLoop = true;
						loop.push(this.links[j].from);
					}
					this.loops.push({
						id: this.nextLoopId++,
						name: name != null ? name: 'untitled loop ' + this.nextLoopId,
						loop: way
					});
				}
			}
		}
	}
	
	alreadyLinked(id1, id2) {
		//Détecte si un les cercles ne sont pas déjà origine ou destination d'un lien
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (!link.bridge && (link.from == id1 || link.to == id2))
				return true;
		}
		return false;
	}
	
	isSwitch(id: number) {
		const circle = this.getCircle(id);
		return circle.type == 'switch_in' || circle.type == 'switch_out';
	}
	
	createLink(id1: number, id2: number, speed: number, bridge: boolean, loopName: string) {
		//Crée un nouveau lien
		// TODO : ne pas pouvoir linker des switch de boucles différentes
		const b = !bridge && this.isSwitch(id1) && this.isSwitch(id2) && this.getCircle(id1).linked == id2;
		if (!b && id1 != id2 && (bridge || !this.alreadyLinked(id1, id2))) {
			this.links.push({
				id: this.nextLinkId++,
				from: id1,
				to: id2,
				inLoop: false,
				speed: speed,
				length: this.distanceCircles(id1, id2),
				bridge: bridge
			});
		}
		if (this.linking)
			this.networkService.unlink();
		this.checkForLoops(loopName);
	}
	
	angle(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie l'angle entre le vecteur défini par deux points et l'axe des abscisses
		const vectX = x2 - x1;
		const vectY = y2 - y1;
		return Math.atan(vectY / vectX);
	}
	
	distance(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie la distance entre deux points
		return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
	}
	
	distanceCircles(id1: number, id2: number) {
		const circle1 = this.getCircle(id1);
		const circle2 = this.getCircle(id2);
		return this.distance(circle1.x, circle1.y, circle2.x, circle2.y) / (1 + this.zoom / this.baseRadius); //Ne marche pas
		//TODO : 
		//quand zoom + crée lien: même length que si on avait pas zoomé
		//quand zoom + déplace: même length que si on avait pas zoomé
		//quand zoom + modifie length : bon déplacements pour que quand zoom revient à 0, length est la vraie length
	}
	
	moveCircle(circle, centerX: number, centerY: number, shift: number, scaling: boolean) {
		const angle = this.angle(circle.x, circle.y, centerX, centerY);
		const norm = this.distance(circle.x, circle.y, centerX, centerY);
		let scale = 1; 
		if (scaling)
			scale = norm / (this.baseRadius + this.zoom);
		let side = 1;
		if (circle.x < centerX)
			side = -1
		const coef = shift * side * scale;
		circle.x += Math.cos(angle) * coef;
		circle.y += Math.sin(angle) * coef;
		return circle;
	}
	
	removeLoop(id: number) {
		//Supprime une boucle selon l'id
		for (let k = 0; k < this.loops.length; k++) {
			const loop = this.loops[k].loop;
			if (loop.includes(id)) {
				this.loops.splice(k--, 1);
				return;
			}
		}
	}
	
	removeLink(id: number) {
		//Supprimer un lien selon l'id + la boucle si besoin
		// TODO: intégrer à removeCircle
		for (let i = 0; i < this.links.length; i++)
			if (this.links[i].id == id) {
				this.links.splice(i, 1);
				this.removeLoop(id);
				return;
			}
	}
	
	removeCircle(id: number) {
		//Supprime un cercle + les potentiels liens et boucles auquels il appartient
		for (let i = 0; i < this.circles.length; i++)
			if (this.circles[i].id == id) {
				const circle = this.circles[i];
				this.circles.splice(i, 1);
				for (let j = 0; j < this.links.length; j++) {
					const link = this.links[j];
					if (link.from == id || link.to == id) {
						this.links.splice(j--, 1);
						this.removeLoop(link.id);
					}
				}
				if (circle.type == 'switch_in' || circle.type == 'switch_out')
					this.removeCircle(circle.linked);
				if (this.removing)
					this.networkService.toggleRemove();
				return;
			}
	}
	
	convertLinks(id: number) {
		// Convertit les liens pour les envoyer à l'édition
		let res = [];
		this.links.forEach((link) => {
			if (link.bridge && (link.from == id || link.to == id)) {
				res.push({
					id: link.id,
					type: 'bridge'
				});
			} else if (link.from == id) {
				const to = this.getCircle(link.to).name;
				res.push({
					id: link.id,
					type: 'from',
					to: to
				});
			}
			else if (link.to == id) {
				const from = this.getCircle(link.from).name;
				res.push({
					id: link.id,
					type: 'to',
					from: from
				});
			}
		});
		return res;
	}
	
	findCircle(x: number, y: number) {
		//Si un cercle est trouvé, il devient sélectionné
		let found: boolean = false;
		for (let i = 0; i < this.circles.length; i++) {
		  const circle = this.circles[i];
			if (this.distance(circle.x, circle.y, x, y) < circle.r) {
				if (this.linking) {
					if (this.linkingFrom == -1)
						this.linkingFrom = circle.id;
					else 
						this.createLink(this.linkingFrom, circle.id, 16.67, false, null);
				} else if (this.editing) {
					const links = this.convertLinks(circle.id);
					this.networkService.editElement(circle, links);
				}
				else if (this.removing)
					this.removeCircle(circle.id);
				else
					this.selected = i;
				found = true;
			}
		}
		if (!found)
			this.unToggleAll();
	}
	
	unToggleAll() {
		this.selected = -1;
		if (this.linking)
			this.networkService.unlink();
		if (this.editing)
			this.networkService.toggleEdit();
		if (this.removing)
			this.networkService.toggleRemove();
	}
	
	getShift() {
		//Calcule le décalage du canvas par rapport à la page
		const rect = this.canvasElement.getBoundingClientRect();
		return { 
			x: rect.left,
			y: rect.top
		};
	}
	
	select(event: any) {
		//Tente de sélectionner un cercle là où il y a eu un click
		const shift = this.getShift();
		this.findCircle(event.x - shift.x, event.y - shift.y);
		this.update();
	}
	
	move(event: any) {
		//Déplace tous les cercles ou seulement celui sélectionné
		if (this.down && !this.linking && !this.editing) {
			const shift = this.getShift();
			if (this.previous != null) {
				const shiftX = event.x - this.previous[0];
				const shiftY = event.y - this.previous[1];
				if (this.selected != -1) {
					this.circles[this.selected].x += shiftX;
					this.circles[this.selected].y += shiftY;
					const circle = this.circles[this.selected];
					for (let i = 0; i < this.links.length; i++) {
						const link = this.links[i];
						if (link.from == circle.id || link.to == circle.id) {
							let id = link.to;
							if (link.to == circle.id)
								id = link.from;
							this.links[i].length = this.distanceCircles(id, circle.id);
						}
					}
				} else {
					for (let i = 0; i < this.circles.length; i++) {
						this.circles[i].x += shiftX;
						this.circles[i].y += shiftY;
					}
				}
			}
			this.previous = [event.x, event.y];
			this.update();
		}
	}
	
	drop() {
		//Désélectionne tout
		this.selected = -1;
		this.previous = null;
	}
	
	convertNetwork() {
		//Convertit réseau modèle édtieur -> simulateur
		this.network.loops = [];
		this.network.bridges = [];

		for (let i = 0; i < this.loops.length; i++) {
			const loop = this.loops[i];
			this.network.loops.push({
				name: loop.name,
				elements: [],
				sections: [],
				pods: []
			});
			loop.loop.forEach((linkId) => {
				const link = this.getLink(linkId);
				const circle = this.getCircle(link.from);
				let elt = {
					type: circle.type,
					x: circle.x,
					y: circle.y
				}
				if (this.isSwitch(circle.id)) {
					elt['pods'] = [];
					elt['id_bridge'] = circle.link;
				} else {
					elt['pods'] = {
                        name: circle.name,
						max: circle.max_pods,
						count: circle.type == 'station' ? 0: circle.max_pods
					};
					if (elt.type == 'station') {
						elt['station_type'] = circle.station_type;
						elt['travelers'] = {
							count: 0, 
							average_waiting_time: 0, 
							all_time_count: 0
						};
					}
				}
				this.network.loops[i].elements.push(elt);
				this.network.loops[i].sections.push({
					speed: link.speed,
					path: {
						type: 'line'
					}
				});
			});
		}
        this.links.forEach((link) => {
            if (link.bridge) {
                this.network.bridges.push({
                    name: 'test',
                    section: {
                        speed: link.speed,
                        path: {
                            type: 'line'
                        }
                    },
                    pods: []
                });
            }
        });
		this.networkService.updateNetwork(this.network);
	}
    
    centerCircles() {
        let centerX = 0;
        let centerY = 0;
        this.circles.forEach((circle) => {
            centerX += circle.x;
            centerY += circle.y;
        });
        centerX = centerX / this.circles.length - this.canvaWidth / 2;
        centerY = centerY / this.circles.length - this.canvaHeight / 2;
        for (let i = 0; i < this.circles.length; i++) {
            this.circles[i].x -= centerX;
            this.circles[i].y -= centerY;
        }
    }
    
    convertFromNetwork(network) {
        this.network = Object.assign({}, network);
        this.network.loops = [];
        this.network.bridges = [];
        this.networkService.updateNetwork(this.network);
        
        let bridges = [];
        for (let i = 0; i < network.bridges.length; i++)
            bridges.push([]);
        
        network.loops.forEach((loop) => {        
            const firstId = this.nextCircleId;
            loop.elements.forEach((elt) => {
                if (elt.type != 'sensor') {
                    const statOrShed = elt.type == 'station' || elt.type == 'shed'
                    const max_pods = statOrShed ? elt.pods.max: null;
                    const name = statOrShed ? elt.name: null;
                    this.createCircle(elt.x, elt.y, max_pods, name, elt.type);
                    if (!statOrShed)
                        bridges[elt.id_bridge].push(this.circles.length - 1);
                }
            });
            const lastId = this.nextCircleId - 1;
            
            let i = firstId;
            loop.sections.forEach((section) => {
                if (i < lastId)
                    this.createLink(i++, i, section.speed, false, loop.name);
                else
                    this.createLink(lastId, firstId, section.speed, false, loop.name);
            });
        });
        
        this.centerCircles();

        for (let k = 0; k < bridges.length; k++) {
            const i = bridges[k][0];
            const j = bridges[k][1];
            const bridge = network.bridges[k];
            this.linkBridge(i, j, bridge.section.speed, null);
        }
    }

}
