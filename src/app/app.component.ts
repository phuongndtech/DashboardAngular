import { AfterViewInit, Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CanvasJS, CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		CommonModule,
		RouterOutlet,
		CanvasJSAngularChartsModule,
		MatTableModule,
		MatPaginatorModule,
		MatSelectModule,
		MatFormFieldModule,
		MatButtonModule,
		MatInputModule,
		FormsModule,
		HttpClientModule
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.css'
})

export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
	displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];

	productPricesData = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
	ordersData = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

	@ViewChild(MatPaginator) paginator: MatPaginator;

	@ViewChild('first', { read: ElementRef }) firstName: ElementRef<HTMLElement>;

	@ViewChild('last', { read: ElementRef }) lastName: ElementRef<HTMLElement>;

	firstNameAutofilled: boolean;

	lastNameAutofilled: boolean;

	chartData: any[] = [];

	chartContainers = [
		{ id: 'chartContainer1' },
		{ id: 'chartContainer2' },
		{ id: 'chartContainer3' },
		{ id: 'chartContainer4' }
	];

	dataLoaded: boolean = false;

	selected = 'option2';

	getRevenueByPeriod(): Observable<any[]> {
		return this.http.get<any>("https://localhost:7020/api/Dashboards/revenue-period");
	}

	constructor(private _autofill: AutofillMonitor, private http: HttpClient) { }

	ngOnInit(): void {

		this.getRevenueByPeriod().subscribe(data => {
			this.chartData = [];

			for (let period in data) {
				if (data.hasOwnProperty(period)) {
					let periodData = data[period];
					let transformedData = periodData.map((item: any) => {
						return { y: item.percentage, name: item.restaurantName };
					});
					this.chartData.push(transformedData);
				}
			}

			for (var i = 0; i < 4; i++) {
				var chart = new CanvasJS.Chart("chartContainer" + (i + 1), {
					animationEnabled: true,
					title: {
						text: "Revenue Period " + (i + 1)
					},
					data: [{
						type: "pie",
						indexLabel: "{name}: {y}",
						yValueFormatString: "#,###.##'%'",
						dataPoints: this.chartData[i]
					}]
				});

				chart.render();
			}
		})
	}

	ngAfterViewInit(): void {
		this.productPricesData.paginator = this.paginator;
		this.ordersData.paginator = this.paginator;

	}

	barChartTop5ProductsOptions = {
		title: {
			text: "Top 5 Products by Revenue"
		},
		animationEnabled: true,
		axisY: {
			includeZero: true,
			suffix: "K"
		},
		data: [{
			type: "bar",
			indexLabel: "{y}",
			yValueFormatString: "#,###K",
			dataPoints: [
				{ label: "Snapchat", y: 15 },
				{ label: "Instagram", y: 20 },
				{ label: "YouTube", y: 24 },
				{ label: "Twitter", y: 29 },
				{ label: "Facebook", y: 73 }
			]
		}]
	}

	compareRevenuChartOptions = {
		title: {
			text: "Compare Revenue By Years"
		},
		animationEnabled: true,
		data: [{
			type: "column",
			dataPoints: [
				{ x: 10, y: 71 },
				{ x: 20, y: 55 },
				{ x: 30, y: 50 },
				{ x: 40, y: 65 },
				{ x: 50, y: 95 },
				{ x: 60, y: 68 },
				{ x: 70, y: 28 },
				{ x: 80, y: 34 },
				{ x: 90, y: 14 }
			]
		}]
	}

	ordersColumns: string[] = ['position', 'name', 'weight', 'symbol'];
	productPricesColumns: string[] = ['position', 'name'];

	selectedValue: string;
	selectedCar: string;

	foods: Food[] = [
		{ value: 'steak-0', viewValue: 'Steak' },
		{ value: 'pizza-1', viewValue: 'Pizza' },
		{ value: 'tacos-2', viewValue: 'Tacos' },
	];

	cars: Car[] = [
		{ value: 'volvo', viewValue: 'Volvo' },
		{ value: 'saab', viewValue: 'Saab' },
		{ value: 'mercedes', viewValue: 'Mercedes' },
	];

	ngOnDestroy() {
		this._autofill.stopMonitoring(this.firstName);
		this._autofill.stopMonitoring(this.lastName);
	}
}

export interface PeriodicElement {
	name: string;
	position: number;
	weight: number;
	symbol: string;
}

export interface Food {
	value: string;
	viewValue: string;
}

export interface Car {
	value: string;
	viewValue: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
	{ position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
	{ position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
	{ position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
	{ position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
	{ position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
	{ position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
	{ position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
	{ position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
	{ position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
	{ position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
	{ position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na' },
	{ position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg' },
	{ position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al' },
	{ position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si' },
	{ position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P' },
	{ position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S' },
	{ position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl' },
	{ position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar' },
	{ position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K' },
	{ position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca' },
];