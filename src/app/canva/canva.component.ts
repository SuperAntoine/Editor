import { Component, ViewChild, ElementRef, OnInit, } from '@angular/core';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';
 
@Component({
  selector: 'app-canva',
  templateUrl: './canva.component.html',
  styleUrls: ['./canva.component.scss']
})
export class CanvaComponent implements OnInit {

	networkSubscription: Subscription;
	network: Object;
	@ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
	canvasElement;
	ctx: CanvasRenderingContext2D; //Contexte
	fontSize: number = 10;
	circles: any[] = []; //Liste des cercles
	selected: number = -1; //Vaut l'index du cercle sélectionné, -1 sinon
	down: boolean = false; //Vrai s'il y a clique
	previous: number[]; //Position précédente de la souris
	linkingSubscription: Subscription;
	linking: boolean;
	linkingFrom: number = -1;
	links: any[] = [];
	nextLinkId: number = 0;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
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
			}
		);
		this.networkService.emitLinkingSubject();
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
			}
			
			for (let i = 0; i < y.circles.length; i++) 
				if (shift > 0 || y.circles[i]['r'] > 2)
					y.circles[i]['r'] += shift;
				
			for (let i = 0; i < y.circles.length-1; i++)
				for (let j = i+1; j < y.circles.length; j++) {
					if (shift > 0 || y.circles[i]['r'] > 2 && y.circles[j]['r'] > 2) {
						const circle1 = y.circles[i];
						const circle2 = y.circles[j];
						const vectX = circle2['x'] - circle1['x'];
						const vectY = circle2['y'] - circle1['y'];
						const angle = Math.atan(vectY / vectX)
						y.circles[i]['x'] -= shift * (Math.cos(angle)-1);
						y.circles[i]['y'] -= shift * (Math.sin(angle)-1);
						y.circles[j]['x'] += shift * (Math.cos(angle)+1);
						y.circles[j]['y'] += shift * (Math.sin(angle)+1);
					}
				}
				
			y.update();
		}
		this.circles.push({
			id: 0,
			x: 50,
			y: 50,
			r: 30,
			color: 'red',
			text: 'Cercle 1'
		});
		this.circles.push({
			id: 1,
			x: 100,
			y: 100,
			r: 30,
			color: 'blue',
			text: 'Cercle 2'
		});
		this.update();
  }
	
	scaleFont() {
		this.ctx.font = this.fontSize.toString() + 'px serif';
	}
	
	update() {
		//%ets à jour l'affichage
		this.ctx.clearRect(0, 0, 600, 300);
		
		this.circles.forEach((circle) => {
			if (circle['id'] == this.linkingFrom)
				this.ctx.fillStyle = 'yellow';
			else
				this.ctx.fillStyle = circle['color'];
			this.ctx.beginPath();
			this.ctx.arc(circle['x'], circle['y'], circle['r'], 0, Math.PI * 2);
			this.ctx.stroke();
			this.ctx.fill();
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(circle['text'], circle['x'], circle['y'] + circle['r'] * 1.3, circle['r'] * 2);
			this.ctx.closePath();
		});
		
		this.links.forEach((link) => {
			let circle1 = this.circles[link['from']];
			let circle2 = this.circles[link['to']];
			this.ctx.beginPath();
			this.ctx.moveTo(circle1['x'], circle1['y']);
			this.ctx.lineTo(circle2['x'], circle2['y']);
			this.ctx.stroke();
			this.ctx.closePath();
		});
	}
	
	linkExist(id1, id2) {
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i];
			if ((link['from'] == id1 && link['to'] == id2) || (link['from'] == id2 && link['to'] == id1))
				return true;
		}
		return false;
	}
	
	createLink(id1: number, id2: number) {
		if (id1 != id2 && !this.linkExist(id1, id2)) {
			this.links.push({
				id: this.nextLinkId++,
				from: id1,
				to: id2
			});
		}
		this.networkService.unlink();
		this.linkingFrom = -1;
		this.update();
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
			this.linkingFrom = -1;
			this.networkService.unlink();
		}
	}
	
	getShift() {
		const rect = this.canvasElement.getBoundingClientRect();
		return { 
			x: rect.left,
			y: rect.top
		};
	}
	
	select(event: any) {
		//Tente de sélectionné un cercle là où il y a eu un click
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
