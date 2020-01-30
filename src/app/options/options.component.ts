import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs-compat/Subscription';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {

    optionsSubscription: Subscription
    options: any;

    constructor(private networkService: NetworkService) { }

    ngOnInit() {
        this.optionsSubscription = this.networkService.optionsSubject.subscribe(
            (options: any) => {
                this.options = options;
            }
        );
        this.networkService.emitOptionsSubject();
    }

    updateOptions() {
		this.networkService.updateOptions(this.options);
	}

}
