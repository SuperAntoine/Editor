import { Component } from '@angular/core';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'editor';
	
	constructor(private networkService: NetworkService) { }
	
	ngOnInit() {
		this.networkService.init();
	}
}
