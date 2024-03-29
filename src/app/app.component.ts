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

	currentYear: number;

	chartData: any[] = [];

	topProductChartData: any[] = [];

	compareRevenueChartData: any[] = [];

	chartContainers = CHART_CONTAINER;

	dataLoaded: boolean = false;

	selected = 'option2';

	displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];

	productPricesData = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

	ordersData = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

	@ViewChild(MatPaginator) paginator: MatPaginator;

	@ViewChild('first', { read: ElementRef }) firstName: ElementRef<HTMLElement>;

	@ViewChild('last', { read: ElementRef }) lastName: ElementRef<HTMLElement>;

	firstNameAutofilled: boolean;

	lastNameAutofilled: boolean;

	constructor(private _autofill: AutofillMonitor, private http: HttpClient) { }

	ngOnInit(): void {

		this.getCurrentYear().subscribe(data => {
			this.currentYear = data
		})

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

		this.getTopProductRevenue().subscribe(data => {
			this.topProductChartData = [];

			let transformedData = data.productRevenues.map((item: any) => {
				return { label: item.productName, y: Math.round(item.revenue / 1000) }
			});

			this.topProductChartData = transformedData;

			let chart = new CanvasJS.Chart("chartContainer",
				{
					title: {
						text: "Top 5 Products by Revenue (USD)"
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
						dataPoints: this.topProductChartData
					}]
				}
			);
			chart.render();
		});

		this.getRestaurantRevenue().subscribe(data => {
			this.compareRevenueChartData = [];

			for (let restType in data) {
				if (data.hasOwnProperty(restType)) {
					let restTypeData = data[restType];
					let transformedData = restTypeData.map((item: any) => {
						return { label: item.year, y: item.revenue };
					});
					this.compareRevenueChartData.push(transformedData);
				}
			}

			let chart = new CanvasJS.Chart("compareChartContainer", {
				exportEnabled: true,
				animationEnabled: true,
				title: {
					text: "Compare Restaurant Revenue By Years"
				},
				axisX: {
					title: "Years"
				},
				legend: {
					cursor: "pointer"
				},
				data: [{
					type: "column",
					name: "Restaurant 1",
					showInLegend: true,
					yValueFormatString: "#,##0.# USD",
					dataPoints: this.compareRevenueChartData[0]
				},
				{
					type: "column",
					name: "Restaurant 2",
					showInLegend: true,
					yValueFormatString: "#,##0.# USD",
					dataPoints: this.compareRevenueChartData[1]
				}]
			});

			chart.render();
		})
	}

	ngAfterViewInit(): void {
		this.productPricesData.paginator = this.paginator;
		this.ordersData.paginator = this.paginator;
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

	getRevenueByPeriod(): Observable<any[]> {
		return this.http.get<any>(`${BASE_ENDPOINT}/revenue-period`);
	}

	getCurrentYear(): Observable<number> {
		return this.http.get<number>(`${BASE_ENDPOINT}/current-year`);
	}

	getTopProductRevenue(): Observable<any> {
		return this.http.get<any>(`${BASE_ENDPOINT}/top-product`)
	}

	getRestaurantRevenue(): Observable<any> {
		return this.http.get<any>(`${BASE_ENDPOINT}/restaurant-revenue`)
	}

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

const BASE_ENDPOINT: string = "https://localhost:7020/api/Dashboards";

const CHART_CONTAINER = [
	{ id: 'chartContainer1' },
	{ id: 'chartContainer2' },
	{ id: 'chartContainer3' },
	{ id: 'chartContainer4' }
]