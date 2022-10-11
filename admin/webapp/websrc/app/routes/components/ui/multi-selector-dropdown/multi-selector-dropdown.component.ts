import { Component, OnInit, Input , Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-multi-selector-dropdown',
  templateUrl: './multi-selector-dropdown.component.html',
  styleUrls: ['./multi-selector-dropdown.component.scss']
})
export class MultiSelectorDropdownComponent implements OnInit {
  @Input() list:any[];

  @Output() shareCheckedList = new EventEmitter();

  checkedList : any[];
  currentSelected : {};
  showDropDown: boolean;

  constructor() {
  }

  ngOnInit(): void {
    this.checkedList = this.list.filter(item => item.checked).map(item => item.value);
    this.showDropDown = false;
  }

  getSelectedValue = (status: Boolean, value: String) => {
    if(status){
      this.checkedList.push(value);
    }else{
      var index = this.checkedList.indexOf(value);
      this.checkedList.splice(index,1);
    }

    this._shareCheckedList();

  }

  _shareCheckedList = () => {
     this.shareCheckedList.emit(this.checkedList);
  }

}
