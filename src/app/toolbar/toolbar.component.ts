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
  }
	
	link() {
		if (this.linking)
			this.networkService.unlink();
		else
			this.networkService.link();
	}
	
	edit() {
		this.networkService.toggleEdit();
	}
	
	addElement(type: string) {
		this.networkService.addElement(type);
	}
	
	newNetwork() {
		this.networkService.newNetwork();
	}
	
	export() {
		this.networkService.convert();
	}

}
