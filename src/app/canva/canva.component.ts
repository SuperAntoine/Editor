import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
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
	ctx: CanvasRenderingContext2D; //Contexte
	circles: any[] = []; //Liste des cercles
	selected: number = -1; //Vaut l'index du cercle sélectionné, -1 sinon
	down: boolean = false; //Vrai s'il y a clique
	previous: number[]; //Position précédente de la souris

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
		//Observables
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
		//Récupération du contexte
		this.ctx = this.canvas.nativeElement.getContext('2d');
		//Ajout d'événements de la souris
		let y = this;
		document.body.onmousedown = function() {
			y.down = true;
		};
		document.body.onmouseup = function() {
			y.down = false;
		}
		document.body.onwheel = function(event) {
			let shift = -1 * Math.sign(event.deltaY);
			y.erase(true);
			for (let i = 0; i < y.circles.length; i++) {
				y.circles[i]['r'] += shift;
			}
			y.drawCircles();
		}
		this.circles.push({
			x: 50,
			y: 50,
			r: 30,
			color: 'red'
		});
		this.circles.push({
			x: 100,
			y: 100,
			r: 30,
			color: 'blue'
		});
		this.drawCircles();
  }
	
	clear(circle: Object) {
		//Efface un cercle
		this.ctx.clearRect(circle['x'] - circle['r'] - 1, circle['y'] - circle['r'] - 1, circle['r'] * 2 + 2, circle['r'] * 2 + 2);
	}
	
	erase(all: boolean) {
		//Efface tous les cercles ou seulement celui sélectionné
		if (all)
			for (let i = 0; i < this.circles.length; i++)
				this.clear(this.circles[i]);
		else 
			this.clear(this.circles[this.selected]);
	}
	
	drawCircles() {
		//Affiche tous les cercles
		this.circles.forEach((circle) => {
			this.ctx.fillStyle = circle['color'];
			this.ctx.beginPath();
			this.ctx.arc(circle['x'], circle['y'], circle['r'], 0, Math.PI * 2);
			this.ctx.stroke();
			this.ctx.fill();
		});
	}
	
	distance(x1: number, y1: number, x2: number, y2: number) {
		//Renvoie la distance entre deux points
		return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
	}
	
	findCircle(x: number, y: number) {
		//Si un cercle est trouvé, il devient sélectionné
		let found: boolean = false;
		for (let i = 0; i < this.circles.length; i++) {
			let circle = this.circles[i];
			if (this.distance(circle['x'], circle['y'], x, y) < circle['r']) {
				this.selected = i;
				found = true;
			}
		}
		if (!found)
			this.selected = -1;
	}
	
	select(event: any) {
		//Tente de sélectionné un cercle là où il y a eu un click
		this.findCircle(event.x, event.y-170);
	}
	
	move(event: any) {
		//Déplace tous les cercles ou seulement celui sélectionné
		if (this.down) {
			this.erase(this.selected == -1);
			if (this.selected != -1) {
				this.circles[this.selected]['x'] = event.x;
				this.circles[this.selected]['y'] = event.y - 170;
			} else {
				if (this.previous != null)
					for (let i = 0; i < this.circles.length; i++) {
						this.circles[i]['x'] += event.x - this.previous[0];
						this.circles[i]['y'] += event.y - this.previous[1];
					}
				this.previous = [event.x, event.y];
			}
			this.drawCircles();
		}
	}
	
	drop() {
		//Désélectionne tout
		this.selected = -1;
		this.previous = null;
	}

}
