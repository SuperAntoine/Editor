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
	network: Object;

  constructor(private networkService: NetworkService) { }

  ngOnInit() {
		this.networkSubscription = this.networkService.networkSubject.subscribe(
			(network: Object) => {
				this.network = network;
			}
		);
		this.networkService.emitNetworkSubject();
  }

	onSave(form: NgForm) {
		this.networkService.updateNetwork(this.network);
	}

}
