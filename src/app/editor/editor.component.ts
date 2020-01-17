import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';
 
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

	networkSubscription: Subscription;
	network: Object;
	fileUrl;
	linkingSubscription: Subscription;
	linking: boolean;

  constructor(private networkService: NetworkService,
							private sanitizer: DomSanitizer) { }

  ngOnInit() {
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
  }
	
	exportJSON() {
		let blob = new Blob([JSON.stringify(this.network)], { type: 'application/json' });
		let url = window.URL.createObjectURL(blob);
		this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
	
	link() {
		this.networkService.link();
	}
	
	addElement(type: string) {
		this.networkService.addElement(type);
	}

}
