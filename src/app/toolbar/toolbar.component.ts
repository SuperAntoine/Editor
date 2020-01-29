import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs-compat/Subscription';
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
    fileUrl;

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
		let blob = new Blob([JSON.stringify(this.network)], { type: 'application/json' });
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
