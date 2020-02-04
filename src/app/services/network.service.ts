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
	editedSubject = new Subject<Object>();
	removingSubject = new Subject<boolean>();
	removing: boolean;
	newElementSubject = new Subject<string>();
	newElement: string;
	newNetworkSubject = new Subject();
	convertSubject = new Subject();
	exportSubject = new Subject();
	removeLinkSubject = new Subject<number>();
	goToLinkSubject = new Subject<number>();
    jsonSubject = new Subject<any>();
    optionsSubject = new Subject<any>();
    options: any;
	
	init() {
		this.setNetwork();
        this.setOptions();
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
	
	emitEditedElementSubject(elt: Object) {
		this.editedElementSubject.next(elt);
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
	
	emitGoToLinkSubject(id: number) {
		this.goToLinkSubject.next(id);
	}
    
    emitJsonSubject(network: any) {
        this.jsonSubject.next(network);
    }
    
    emitOptionsSubject() {
        this.optionsSubject.next(this.options);
    }
	
	setNetwork() {
		this.network = {
			name: 'Untitled network',
			time: 0,
            hours: 0,
            minutes: 0,
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
    
    setOptions() {
        this.options = {
            station: true,
            shed: true,
            bridge: true,
            loop: true,
            zoom: 10,
            switch: false
        };
    }
    
    updateOptions(options) {
        this.options = options;
        this.emitOptionsSubject();
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
		this.emitEditingSubject();
	}
    
    editElement(elt: Object) {
        this.toggleEdit();
        this.emitEditedElementSubject(elt);
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
        this.editedElementSubject.next(null);
	}
	
	convert() {
		this.emitConvertSubject();
	}
	
	export() {
		this.emitExportSubject();
	}
	
}