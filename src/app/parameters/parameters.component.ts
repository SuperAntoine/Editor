import { Component, OnInit, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-parameters',
  templateUrl: './parameters.component.html',
  styleUrls: ['./parameters.component.scss']
})
export class ParametersComponent implements OnInit {
    
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.width = window.innerWidth * 0.77;
    }

	networkSubscription: Subscription;
	network: any;
	editedElementSubscription: Subscription;
	editedElement: any;
    maxSpeed: number;
    width;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
        this.width = window.innerWidth * 0.77;
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
                this.maxSpeed = network['max_speed'];
			}
		);
		this.networkService.emitNetworkSubject();
		this.editedElementSubscription = this.networkService.editedElementSubject.subscribe(
			(editedElement: Object) => {
				this.editedElement = editedElement;
			}
		);
  }

	onSave(form: NgForm) {
		if (this.editedElement == null)
			this.networkService.updateNetwork(this.network);
		else {
			this.networkService.emitEditedSubject(this.editedElement.elt);
			this.editedElement = null;
		}
	}
	
	removeLink(id: number) {
		const links = this.editedElement.links;
		for (let i = 0; i < links.length; i++)
			if (links[i].id == id)
				this.editedElement.links.splice(i--, 1);
		this.networkService.emitRemoveLinkSubject(id);
	}
	
	goTo(id: number) {
		this.networkService.emitGoToLinkSubject(id);
	}
    
    radToDeg(angle: number) {
        return angle * 180 / Math.PI;
    }

}
