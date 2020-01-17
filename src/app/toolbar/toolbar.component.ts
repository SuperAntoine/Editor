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

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
			}
		);
		this.networkService.emitLinkingSubject();
  }
	
	link() {
		if (this.linking)
			this.networkService.unlink();
		else
			this.networkService.link();
	}
	
	addElement(type: string) {
		this.networkService.addElement(type);
	}

}
