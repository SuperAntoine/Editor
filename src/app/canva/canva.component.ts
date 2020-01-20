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
	canvasElement; //El�ment canvas
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
	
	network: any; //R�seau
	fontSize: number = 10; //Taille de la police
	circles: any[]; //Liste des cercles
	nextCircleId: number; //Prochain id de cercle
	selected: number; //Vaut l'index du cercle s�lectionn�, -1 sinon
	down: boolean = false; //Vrai s'il y a clique
	previous: number[]; //Position pr�c�dente de la souris
	linking: boolean; //Vaut vrai si un lien est entrain d'�tre cr��
	linkingFrom: number; //Origine du lien
	links: any[]; //Liste des liens
	editing: boolean; //Vaut vrai si on est entrain d'�dier
	removing: boolean; //Vaut vrai si on est entrain de supprimer
	nextLinkId: number; //Prochain id de lien
	loops: any[]; //Liste des boucles 
	nextLoopId: number; //Prochain id de boucle
	zoom: number; //Zoom actuel
	baseRadius = 30; //Rayon de base d'un cercle

  constructor(private networkService: NetworkService) { }

  ngOnInit() {		
		this.canvasElement = document.querySelector('canvas');
		//R�cup�ration du contexte
		this.ctx = this.canvas.nativeElement.getContext('2d');
		this.ctx.textAlign = 'center';
		
		this.newNetwork();
		//Ajout d'�v�nements de la souris
		const y = this;
		
		//D�tection du click
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
				if (shift > 0 || circle.r > 2) {
					const angle = y.angle(circle.x, circle.y, centerX, centerY);
					const norm = y.distance(circle.x, circle.y, centerX, centerY)
					const scale = norm / (y.baseRadius + y.zoom);
					let side = 1;
					if (circle.x < centerX)
						side = -1
					const coef = shift * side * scale;
					y.circles[i].x += Math.cos(angle) * coef;
					y.circles[i].x += Math.sin(angle) * coef;
				}
			}
			y.update();
		}
		
		//Observables
		// Synchronisation du r�seau
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
		// Mise � jour de l'�tat de liaison
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
				if (!linking) {
					this.linkingFrom = -1;
					this.update();
				}
			}
		);
		// Synchronisation de l'�tat d'�dition
		this.networkService.emitLinkingSubject();
		this.editingSubscription = this.networkService.editingSubject.subscribe(
			(editing: boolean) => {
				this.editing = editing;
			}
		);
		this.networkService.emitEditingSubject();
		// R�ception de l'�l�ment modifi�
		this.editedSubscription = this.networkService.editedSubject.subscribe(
			(elt: any) => {
				for (let i = 0; i < this.circles.length; i++) 
					if (this.circles[i].id == elt.id)
						this.circles[i] = elt;
				this.update();
			}
		);
		// R�ception de l'ordre de cr�ation d'un nouvel �l�ment
		this.newElementSubscription = this.networkService.newElementSubject.subscribe(
			(type: string) => {
				let max = 4
				if (type == 'shed')
					max = 50
				this.circles.push({
					id: this.nextCircleId++,
					x: this.canvasElement.width/2,
					y: this.canvasElement.height/2,
					r: this.baseRadius + this.zoom,
					type: type,
					name: 'new ' + type,
					station_type: 1,
					pods: { max: max }
				});
				this.unToggleAll();
			}
		);
		// Synchronisation de l'�tat de suppression
		this.removingSubscription = this.networkService.removingSubject.subscribe(
			(removing: boolean) => {
				this.removing = removing;
			}
		);
		this.networkService.emitRemovingSubject();
		// R�ception de l'ordre de reset du r�seau
		this.newNetworkSubscription = this.networkService.newNetworkSubject.subscribe(
			() => {
				y.newNetwork()
			}
		);
		// R�ception de l'ordre d'exportation
		this.convertSubscription = this.networkService.convertSubject.subscribe(
			() => {
				y.convertNetwork();
				y.networkService.export();
			}
		);
		// R�ception de l'ordre de suppression d'un lien
		this.removeLinkSubscription = this.networkService.removeLinkSubject.subscribe(
			(id: number) => {
				this.removeLink(id);
				this.update();
			}
		);
		}
	
	newNetwork() {
		//R�initialise le mod�le �dtieur
		this.selected = -1;
		this.circles = [];
		this.nextCircleId = 0;
		this.links = [];
		this.nextLinkId = 0;
		this.loops = [];
		this.nextLoopId = 0;
		this.zoom = 0;
		this.update();
	}
	
	scaleFont() {
		//Change la police d'�criture
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
			if (this.links[i].id == id)
				return this.links[i];
		return null;
	}
	
	update() {
		//Mets � jour l'affichage
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
				}
				
			//Tra�age du cercle
			this.ctx.beginPath();
			this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
			this.ctx.stroke();
			this.ctx.fill();
			//Affichage du texte
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(circle.name, circle.x, circle.y + circle.r * 1.3, circle.r * 2);
			this.ctx.closePath();
		});
		
		//Affichage des liens
		this.links.forEach((link) => {
			let circle1 = this.circles[link.from];
			let circle2 = this.circles[link.to];
			this.ctx.beginPath();
			//Affichage de la ligne
			this.ctx.moveTo(circle1.x, circle1.y);
			this.ctx.lineTo(circle2.x, circle2.y);
			//Calculs
			const angle = this.angle(circle1.x, circle1.y, circle2.x, circle2.y) + 5 * Math.PI / 6;
			let side = 1;
			if (circle2.x < circle1.x)
				side = -1
			const coef = (20 + this.zoom) * side;
			//Affichage des fl�ches
			this.ctx.lineTo(circle2.x + Math.cos(angle) * coef, circle2.y + Math.sin(angle) * coef);
			this.ctx.stroke()
			this.ctx.moveTo(circle2.x, circle2.y);
			this.ctx.lineTo(circle2.x + Math.cos(angle + Math.PI/3) * coef, circle2.y + Math.sin(angle + Math.PI/3) * coef);
			this.ctx.stroke();
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
			if (this.links[i].from == id)
				return i;
		return -1;
	}
	
	checkForLoops() {
		//V�rifie s'il faut cr�er une boucle
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (!link.inLoop) {
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
						//S'il n'existe pas la boucle n'est pas ferm�e
						stop = true;
					else if (links[nextLink].checked)
						//Si le lien est d�j� marqu�, on est revenu au point de d�part
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
						id: this.nextLoopId,
						name: 'untitled loop',
						loop: way
					});
				}
			}
		}
	}
	
	alreadyLinked(id1, id2) {
		//D�tecte si un les cercles ne sont pas d�j� origine ou destination d'un lien
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (link.from == id1 || link.to == id2)
				return true;
		}
		return false;
	}
	
	createLink(id1: number, id2: number) {
		//Cr�e un nouveau lien
		if (id1 != id2 && !this.alreadyLinked(id1, id2)) {
			this.links.push({
				id: this.nextLinkId++,
				from: id1,
				to: id2,
				inLoop: false
			});
		}
		this.networkService.unlink();
		this.checkForLoops();
	}
	
	angle(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie l'angle entre le vecteur d�fini par deux points et l'axe des abscisses
		const vectX = x2 - x1;
		const vectY = y2 - y1;
		return Math.atan(vectY / vectX);
	}
	
	distance(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie la distance entre deux points
		return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
	}
	
	removeLoop(id: number) {
		//Supprime une boucle selon l'id
		for (let k = 0; k < this.loops.length; k++) {
			const loop = this.loops[k].loop;
			if (loop.includes(id)) {
				this.loops.splice(k--, 1);
				this.checkForLoops();
				return;
			}
		}
	}
	
	removeLink(id: number) {
		//Supprimer un lien selon l'id + la boucle si besoin
		// TODO: int�grer � removeCircle
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
				this.circles.splice(i, 1);
				for (let j = 0; j < this.links.length; j++) {
					const link = this.links[j];
					if (link.from == id || link.to == id) {
						this.links.splice(j--, 1);
						this.removeLoop(link.id);
					}
				}
				this.networkService.toggleRemove();
				return;
			}
	}
	
	convertLinks(id: number) {
		// Convertit les liens pour les envoyer � l'�dition
		let res = [];
		this.links.forEach((link) => {
			if (link.from == id) {
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
		//Si un cercle est trouv�, il devient s�lectionn�
		let found: boolean = false;
		for (let i = 0; i < this.circles.length; i++) {
		  const circle = this.circles[i];
			if (this.distance(circle.x, circle.y, x, y) < circle.r) {
				if (this.linking) {
					if (this.linkingFrom == -1)
						this.linkingFrom = i;
					else 
						this.createLink(this.linkingFrom, circle.id);
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
		this.networkService.unlink();
		if (this.editing)
			this.networkService.toggleEdit();
		if (this.removing)
			this.networkService.toggleRemove();
	}
	
	getShift() {
		//Calcule le d�calage du canvas par rapport � la page
		const rect = this.canvasElement.getBoundingClientRect();
		return { 
			x: rect.left,
			y: rect.top
		};
	}
	
	select(event: any) {
		//Tente de s�lectionner un cercle l� o� il y a eu un click
		const shift = this.getShift();
		this.findCircle(event.x - shift.x, event.y - shift.y);
		this.update();
	}
	
	move(event: any) {
		//D�place tous les cercles ou seulement celui s�lectionn�
		if (this.down && !this.linking && !this.editing) {
			const shift = this.getShift();
			if (this.previous != null) {
				if (this.selected != -1) {
					this.circles[this.selected].x += event.x - this.previous[0];
					this.circles[this.selected].y += event.y - this.previous[1];
				} else {
					for (let i = 0; i < this.circles.length; i++) {
						this.circles[i].x += event.x - this.previous[0];
						this.circles[i].y += event.y - this.previous[1];
					}
				}
			}
			this.previous = [event.x, event.y];
			this.update();
		}
	}
	
	drop() {
		//D�s�lectionne tout
		this.selected = -1;
		this.previous = null;
	}
	
	convertNetwork() {
		//Convertit r�seau mod�le �dtieur -> simulateur
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
					name: circle.name,
					x: circle.x,
					y: circle.y,
					station_type: circle.station_type
				}
				if (elt.type == 'station') {
					elt['travelers'] = {
						count: 0, 
						average_waiting_time: 0, 
						all_time_count: 0
					}
					elt['pods']['count'] = 0;
				} else if (elt.type == 'shed')
					elt['pods']['count'] = circle.pods.max;
				this.network.loops[i].elements.push(elt);
				this.network.loops[i].sections.push({
					speed: 16.67,
					path: {
						type: 'line'
					}
				});
			});
		}
		this.networkService.updateNetwork(this.network);
	}

}
