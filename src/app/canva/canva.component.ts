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
	newElementSubscription: Subscription;
	
	network: Object; //Réseau
	fontSize: number = 10; //Taille de la police
	circles: any[] = []; //Liste des cercles
	nextCircleId: number = 0; //Prochain id de cercle
	selected: number = -1; //Vaut l'index du cercle sélectionné, -1 sinon
	down: boolean = false; //Vrai s'il y a clique
	previous: number[]; //Position précédente de la souris
	linking: boolean; //Vaut vrai si un lien est entrain d'être créé
	linkingFrom: number = -1; //Origine du lien
	links: any[] = []; //Liste des liens
	nextLinkId: number = 0; //Prochain id de lien
	loops: any[] = [];
	nextLoopId: number = 0;
	zoom: number = 0;
	baseRadius = 30;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {		
		this.canvasElement = document.querySelector('canvas');
		//Récupération du contexte
		this.ctx = this.canvas.nativeElement.getContext('2d');
		this.ctx.textAlign = 'center';
		
		//Ajout d'événements de la souris
		let y = this;
		
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
				if (shift > 0 || y.circles[i]['r'] > 2)
					y.circles[i]['r'] += shift;
				
			let centerX = 0;
			let centerY = 0;
			y.circles.forEach((circle) => {
				centerX += circle['x'];
				centerY += circle['y'];
			});
			centerX /= y.circles.length;
			centerY /= y.circles.length;
				
			for (let i = 0; i < y.circles.length; i++)
				if (shift > 0 || y.circles[i]['r'] > 2) {
					const circle1 = y.circles[i];
					const vectX = centerX - circle1['x'];
					const vectY = centerY - circle1['y'];
					const angle = Math.atan(vectY / vectX);
					const norm = y.distance(y.circles[i]['x'], y.circles[i]['y'], centerX, centerY)
					const scale = norm / (y.baseRadius + y.zoom);
					let side = 1;
					if (circle1['x'] < centerX)
						side = -1
					const coef = shift * side * scale;
					y.circles[i]['x'] += Math.cos(angle) * coef;
					y.circles[i]['y'] += Math.sin(angle) * coef;
				}
			y.update();
		}
		
		//Observables
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
				if (!linking) {
					this.linkingFrom = -1;
					this.update();
				}
			}
		);
		this.networkService.emitLinkingSubject();
		this.newElementSubscription = this.networkService.newElementSubject.subscribe(
			(type: string) => {
				this.circles.push({
					id: this.nextCircleId++,
					x: this.canvasElement.width/2,
					y: this.canvasElement.height/2,
					r: this.baseRadius + this.zoom,
					type: type,
					name: 'new ' + type
				});
				this.networkService.unlink();
			}
		);
  }
	
	scaleFont() {
		//Change la police d'écriture
		this.ctx.font = this.fontSize.toString() + 'px serif';
	}
	
	getCircle(id: number) {
		//Renvoie un cercle selon l'id
		for (let i = 0; i < this.circles.length; i++)
			if (this.circles[i]['id'] == id)
				return this.circles[i];
		return null;
	}
	
	getLink(id: number) {
		//Renvoie un lien selon l'id
		for (let i = 0; i < this.links.length; i++)
			if (this.links[i]['id'] == id)
				return this.links[i];
		return null;
	}
	
	update() {
		//Mets à jour l'affichage
		this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
		
		//Affichage des cerlces
		this.circles.forEach((circle) => {
			//Couleur
			if (circle['id'] == this.linkingFrom)
				this.ctx.fillStyle = 'yellow';
			else
				switch(circle['type']) {
					case 'station': {
						this.ctx.fillStyle = 'red';
						break;
					}
					case 'shed': {
						this.ctx.fillStyle = 'blue';
						break;
					}
				}
				
			//Traçage du cercle
			this.ctx.beginPath();
			this.ctx.arc(circle['x'], circle['y'], circle['r'], 0, Math.PI * 2);
			this.ctx.stroke();
			this.ctx.fill();
			//Affichage du texte
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(circle['name'], circle['x'], circle['y'] + circle['r'] * 1.3, circle['r'] * 2);
			this.ctx.closePath();
		});
		
		//Affichage des liens
		this.links.forEach((link) => {
			let circle1 = this.circles[link['from']];
			let circle2 = this.circles[link['to']];
			this.ctx.beginPath();
			this.ctx.moveTo(circle1['x'], circle1['y']);
			this.ctx.lineTo(circle2['x'], circle2['y']);
			const vectX = circle2['x'] - circle1['x'];
			const vectY = circle2['y'] - circle1['y'];
			const angle = Math.atan(vectY / vectX) + 5 * Math.PI / 6;
			let side = 1;
			if (circle2['x'] < circle1['x'])
				side = -1
			const coef = (20 + this.zoom) * side;
			this.ctx.lineTo(circle2['x'] + Math.cos(angle) * coef, circle2['y'] + Math.sin(angle) * coef);
			this.ctx.stroke()
			this.ctx.moveTo(circle2['x'], circle2['y']);
			this.ctx.lineTo(circle2['x'] + Math.cos(angle + Math.PI/3) * coef, circle2['y'] + Math.sin(angle + Math.PI/3) * coef);
			this.ctx.stroke();
			this.ctx.closePath();
		});
		
		//Affiche des boucles
		this.loops.forEach((loop) => {
			const n = loop['loop'].length;
			let centerX = 0;
			let centerY = 0;
			loop['loop'].forEach((linkId) => {
				const link = this.getLink(linkId);
				const circle = this.getCircle(link['from']);
				centerX += circle['x'];
				centerY += circle['y'];
			});
			centerX /= n;
			centerY /= n;
			this.ctx.beginPath();
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(loop['name'], centerX, centerY);
		});
	}
	
	findLink(id: number) {
		//Renvoie l'indice d'un lien selon l'id
		for (let i = 0; i < this.links.length; i++)
			if (this.links[i]['from'] == id)
				return i;
		return -1;
	}
	
	checkForLoops() {
		//Vérifie s'il faut créer une boucle
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (!link.inLoop) {
				let stop = false;
				let isLoop = false;
				let links = Object.assign([], this.links);
				let next = link['to'];
				let way = [i];
				const id = link['from'];
				
				for (let j = 0; j < links.length; j++)
					links[j]['checked'] = false;
				links[i]['checked'] = true;
				
				while (!stop && !isLoop) {
					//On cherche le prochain lien
					const nextLink = this.findLink(next);
					if (nextLink == -1)
						//S'il n'existe pas la boucle n'est pas fermée
						stop = true;
					else if (links[nextLink]['checked'])
						//Si le lien est déjà marqué, on est revenu au point de départ
						isLoop = true;
					else {
						//Sinon, on ajoute le lien au chemin et on passe au suivant
						way.push(nextLink);
						next = links[nextLink]['to'];
					}
				}
				if (isLoop) {
					let loop = []
					for (let j of way) {
						this.links[j].inLoop = true;
						loop.push(this.links[j]['from']);
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
		//Détecte si un les cercles ne sont pas déjà origine ou destination d'un lien
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if (link['from'] == id1 || link['to'] == id2)
				return true;
		}
		return false;
	}
	
	createLink(id1: number, id2: number) {
		//Crée un nouveau lien
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
	
	distance(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie la distance entre deux points
		return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
	}
	
	findCircle(x: number, y: number) {
		//Si un cercle est trouvé, il devient sélectionné
		let found: boolean = false;
		for (let i = 0; i < this.circles.length; i++) {
		  const circle = this.circles[i];
			if (this.distance(circle['x'], circle['y'], x, y) < circle['r']) {
				if (this.linking) {
					if (this.linkingFrom == -1)
						this.linkingFrom = i;
					else 
						this.createLink(this.linkingFrom, circle['id']);
				} else
					this.selected = i;
				found = true;
			}
		}
		if (!found) {
			this.selected = -1;
			this.networkService.unlink();
		}
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
		this.findCircle(event.x - shift['x'], event.y - shift['y']);
		this.update();
	}
	
	move(event: any) {
		//Déplace tous les cercles ou seulement celui sélectionné
		if (this.down) {
			const shift = this.getShift();
			if (this.selected != -1) {
				this.circles[this.selected]['x'] = event.x - shift['x'];
				this.circles[this.selected]['y'] = event.y - shift['y'];
			} else {
				if (this.previous != null)
					for (let i = 0; i < this.circles.length; i++) {
						this.circles[i]['x'] += event.x - this.previous[0];
						this.circles[i]['y'] += event.y - this.previous[1];
					}
				this.previous = [event.x, event.y];
			}
			this.update();
		}
	}
	
	drop() {
		//Désélectionne tout
		this.selected = -1;
		this.previous = null;
	}

}
