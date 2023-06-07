import { Component, OnInit, Input , Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-multi-selector-dropdown',
  templateUrl: './multi-selector-dropdown.component.html',
  styleUrls: ['./multi-selector-dropdown.component.scss']
})
export class MultiSelectorDropdownComponent implements OnInit {
  @Input() list: any[];
  @Input() isUsingI18n: Boolean = false;

  @Output() shareCheckedList = new EventEmitter();

  checkedList : any[];
  displaySelection : string[];
  showDropDown: boolean;

  constructor(
    private translate: TranslateService
  ) {
  }

  ngOnInit(): void {
    this.checkedList = this.list.filter(item => item.checked).map(item => item.value);
    this.displaySelection = this.checkedList.map(item => this.isUsingI18n ? this.translate.instant(`admissionControl.values.${item.toUpperCase()}`) : item);
    this.showDropDown = false;
  }

  getSelectedValue = (status: Boolean, value: String) => {
    if(status){
      this.checkedList.push(value);
    }else{
      var index = this.checkedList.indexOf(value);
      this.checkedList.splice(index,1);
    }

    this.displaySelection = this.checkedList.map(item => this.isUsingI18n ? this.translate.instant(`admissionControl.values.${item.toUpperCase()}`) : item);
    console.log(this.checkedList, this.displaySelection);
    this._shareCheckedList();
  }

  _shareCheckedList = () => {
     this.shareCheckedList.emit(this.checkedList);
  }

}
