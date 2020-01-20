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
	exportSubscription: Subscription;
	network: any;
	fileUrl;

  constructor(private networkService: NetworkService,
							private sanitizer: DomSanitizer) { }

  ngOnInit() {
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
		this.exportSubscription = this.networkService.exportSubject.subscribe(
			() => {
				this.exportJSON();
			}
		);
  }
	
	exportJSON() {
		let blob = new Blob([JSON.stringify(this.network)], { type: 'application/json' });
		let url = window.URL.createObjectURL(blob);
		this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

}
