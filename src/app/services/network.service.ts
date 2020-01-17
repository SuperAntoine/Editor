import { Subject } from 'rxjs-compat/Subject';

import { Injectable } from '@angular/core';

@Injectable()
export class NetworkService {
	networkSubject = new Subject<Object>();
	network: Object;
	linkingSubject = new Subject<boolean>();
	linking: boolean;
	
	init() {
		this.network = {
			name: 'Untitled network',
			time: 0,
			state: 42,
			running: false,
			margin_min: 2,
			max_speed: 30,
			pod_size: 2,
			places_number: 5,
			dynamic_routing: false,
			view_box: {
				x: 0,
				y: 200,
				width: 600,
				height: 500
			},
			loops: [],
			bridges: []
		};
		this.emitNetworkSubject();
		this.linking = false;
		this.emitLinkingSubject();
	}
	
	emitNetworkSubject() {
		this.networkSubject.next(this.network);
	}
	
	emitLinkingSubject() {
		this.linkingSubject.next(this.linking);
	}
	
	link() {
		this.linking = true;
		this.emitLinkingSubject();
	}
	
	unlink() {
		this.linking = false;
		this.emitLinkingSubject();
	}
	
}