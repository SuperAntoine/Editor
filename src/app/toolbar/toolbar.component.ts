import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
	
	linkingSubscription: Subscription;
	linking: boolean;
	editingSubscription: Subscription;
	editing: boolean
	removingSubscription: Subscription;
	removing: boolean;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
			}
		);
		this.networkService.emitLinkingSubject();
		this.editingSubscription = this.networkService.editingSubject.subscribe(
			(editing: boolean) => {
				this.editing = editing;
			}
		);
		this.networkService.emitEditingSubject();
		this.removingSubscription = this.networkService.removingSubject.subscribe(
			(removing: boolean) => {
				this.removing = removing;
			}
		);
		this.networkService.emitRemovingSubject();
  }
	
	link() {
		if (this.editing)
			this.networkService.toggleEdit();
		if (this.removing)
			this.networkService.toggleRemove();
		if (this.linking)
			this.networkService.unlink();
		else
			this.networkService.link();
	}
	
	edit() {
		if (this.linking) 
			this.networkService.unlink();
		if (this.removing)
			this.networkService.toggleRemove();
		this.networkService.toggleEdit();
	}
	
	addElement(type: string) {
		this.networkService.addElement(type);
	}
	
	remove() {
		if (this.linking)
			this.networkService.unlink();
		if (this.editing)
			this.networkService.toggleEdit();
		this.networkService.toggleRemove();
	}
	
	newNetwork() {
		this.networkService.newNetwork();
	}
	
	export() {
		this.networkService.convert();
	}

}
