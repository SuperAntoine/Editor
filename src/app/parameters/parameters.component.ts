import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-parameters',
  templateUrl: './parameters.component.html',
  styleUrls: ['./parameters.component.scss']
})
export class ParametersComponent implements OnInit {

	networkSubscription: Subscription;
	network: any;
	editedElementSubscription: Subscription;
	editedElement: any;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
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
			this.networkService.emitEditedSubject(this.editedElement);
			this.networkService.toggleEdit();
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

}
