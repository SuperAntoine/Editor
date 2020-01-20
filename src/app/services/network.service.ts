import { Subject } from 'rxjs-compat/Subject';

import { Injectable } from '@angular/core';

@Injectable()
export class NetworkService {
	networkSubject = new Subject<any>();
	network: any;
	linkingSubject = new Subject<boolean>();
	linking: boolean;
	editingSubject = new Subject<boolean>();
	editing: boolean;
	editedElementSubject = new Subject<Object>();
	editedElement: Object;
	editedSubject = new Subject<Object>();
	newElementSubject = new Subject<string>();
	newElement: string;
	newNetworkSubject = new Subject();
	convertSubject = new Subject();
	exportSubject = new Subject();
	
	init() {
		this.setNetwork();
		this.unlink();
		this.editing = false;
		this.emitEditingSubject();
	}
	
	emitNetworkSubject() {
		this.networkSubject.next(this.network);
	}
	
	emitLinkingSubject() {
		this.linkingSubject.next(this.linking);
	}
	
	emitEditingSubject() {
		this.editingSubject.next(this.editing);
	}
	
	emitEditedElementSubject() {
		this.editedElementSubject.next(this.editedElement);
	}
	
	emitEditedSubject(elt: Object) {
		this.editedSubject.next(elt);
	}
	
	emitNewElementSubject() {
		this.newElementSubject.next(this.newElement);
	}
	
	emitNewNetworkSubject() {
		this.newNetworkSubject.next();
	}
	
	emitConvertSubject() {
		this.convertSubject.next();
	}
	
	emitExportSubject() {
		this.exportSubject.next();
	}
	
	setNetwork() {
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
	}
	
	updateNetwork(network: Object) {
		this.network = network;
		this.emitNetworkSubject();
	}
	
	link() {
		this.linking = true;
		this.emitLinkingSubject();
	}
	
	unlink() {
		this.linking = false;
		this.emitLinkingSubject();
	}
	
	toggleEdit() {
		this.editing = !this.editing;
		if (!this.editing)
			this.editElement(null);
		this.emitEditingSubject();
	}
	
	editElement(elt: Object) {
		this.editedElement = elt;
		this.emitEditedElementSubject();
	}
	
	addElement(type: string) {
		this.newElement = type;
		this.emitNewElementSubject();
	}
	
	newNetwork() {
		this.setNetwork();
		this.unlink();
		if (this.editing)
			this.toggleEdit();
		this.emitNewNetworkSubject();
	}
	
	convert() {
		this.emitConvertSubject();
	}
	
	export() {
		this.emitExportSubject();
	}
	
}