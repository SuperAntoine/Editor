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
	removingSubject = new Subject<boolean>();
	removing: boolean;
	newElementSubject = new Subject<string>();
	newElement: string;
	newNetworkSubject = new Subject();
	convertSubject = new Subject();
	exportSubject = new Subject();
	removeLinkSubject = new Subject<number>();
	
	init() {
		this.setNetwork();
		this.unlink();
		this.editing = false;
		this.emitEditingSubject();
		this.removing = false;
		this.emitRemovingSubject();
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
	
	emitRemovingSubject() {
		this.removingSubject.next(this.removing);
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
	
	emitRemoveLinkSubject(id: number) {
		this.removeLinkSubject.next(id);
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
			this.editElement(null, null);
		this.emitEditingSubject();
	}
	
	editElement(elt: Object, links: any[]) {
		if (elt == null)
			this.editedElement = null;
		else
			this.editedElement = {
				elt: elt,
				links: links
				};
		this.emitEditedElementSubject();
	}
	
	addElement(type: string) {
		this.newElement = type;
		this.emitNewElementSubject();
	}
	
	toggleRemove() {
		this.removing = !this.removing;
		this.emitRemovingSubject();
	}
	
	newNetwork() {
		this.setNetwork();
		this.unlink();
		if (this.editing)
			this.toggleEdit();
		if (this.removing)
			this.toggleRemove();
		this.emitNewNetworkSubject();
	}
	
	convert() {
		this.emitConvertSubject();
	}
	
	export() {
		this.emitExportSubject();
	}
	
}