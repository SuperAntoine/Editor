import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs-compat/Subscription';
import { createPopper } from '@popperjs/core';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
	
	linkingSubscription: Subscription;
	linking: boolean;
	editingSubscription: Subscription;
	editing: boolean
	removingSubscription: Subscription;
	removing: boolean;
    networkSubscription: Subscription;
	network: any;
    exportSubscription: Subscription;
    options: boolean = false;
    fileUrl;
    btn_options: HTMLElement;
    menu_options: HTMLElement;

    constructor(private networkService: NetworkService,
                private sanitizer: DomSanitizer) { }

    ngOnInit() {
		this.linkingSubscription = this.networkService.linkingSubject.subscribe(
			(linking: boolean) => {
				this.linking = linking;
			}
		);
		this.networkService.emitLinkingSubject();
		this.editingSubscription = this.networkService.editingSubject.subscribe(
			(editing: boolean) => {
				this.editing = editing;
			}
		);
		this.networkService.emitEditingSubject();
		this.removingSubscription = this.networkService.removingSubject.subscribe(
			(removing: boolean) => {
				this.removing = removing;
			}
		);
		this.networkService.emitRemovingSubject();
        
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
        
        //Configuration du popper du menu
        //On utilise une Promise car il doit être visible lorsqu'il est initilialisé sinon il s'affiche mal
        //On le cache donc dans le then
        this.btn_options = document.querySelector('#btn_options') as HTMLElement;
        this.menu_options = document.querySelector('#menu_options') as HTMLElement;
        new Promise((resolve, reject) => {
            createPopper(this.btn_options, this.menu_options, {
                placement: 'bottom',
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8]
                        }
                    }
                ]
            });
            resolve();
        }).then(() => {
            this.menu_options.setAttribute('data-hide', '');
        });
    }
	
	link() {
		if (this.editing)
			this.networkService.toggleEdit();
		if (this.removing)
			this.networkService.toggleRemove();
		if (this.linking)
			this.networkService.unlink();
		else
			this.networkService.link();
	}
	
	edit() {
		if (this.linking) 
			this.networkService.unlink();
		if (this.removing)
			this.networkService.toggleRemove();
		this.networkService.toggleEdit();
	}
	
	addElement(type: string) {
		this.networkService.addElement(type);
	}
	
	remove() {
		if (this.linking)
			this.networkService.unlink();
		if (this.editing)
			this.networkService.toggleEdit();
		this.networkService.toggleRemove();
	}
    
    toggleOptions() {
        this.options = !this.options;
        if (this.options) {
            this.menu_options.removeAttribute('data-hide');
        } else {
            this.menu_options.setAttribute('data-hide', '');
        }
    }
	
	newNetwork() {
		this.networkService.newNetwork();
	}
	
	export() {
		this.networkService.convert();
	}
    
    import(files) {
        const file = files.item(0);
        file.text().then((text) => {
            try {
                this.networkService.emitJsonSubject(JSON.parse(text));
                this.networkService.editedElementSubject.next(null);
            } catch(SyntaxError) {
                console.log('error');
            }
        });
    }
    
    getFileName() {
        let res = this.network.name.toLowerCase();
        return res.replace(/ /g, '_') + '.json';
        
    }
    
    exportJSON() {
        let network = Object.assign({}, this.network);
        delete network.hours;
        delete network.minutes;
        
		let blob = new Blob([JSON.stringify(network)], { type: 'application/json' });
		let url = window.URL.createObjectURL(blob);
		this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        //Lance le téléchargement
        const fileName = this.getFileName();
        if (window.navigator && window.navigator.msSaveOrOpenBlob)
            window.navigator.msSaveOrOpenBlob(blob, fileName);
        else {
            let link = document.createElement('a');
            link.target = '_blank';
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute("download", fileName);
            link.click();
        }
	}

}
