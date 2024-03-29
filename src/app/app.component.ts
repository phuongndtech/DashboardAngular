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

	ordersColumns: string[] = ORDER_COLUMN;

	dataSource = new MatTableDataSource<Order>([]);

	@ViewChild(MatPaginator) paginator: MatPaginator;
	
	@ViewChild('productName', { read: ElementRef }) productName: ElementRef<HTMLElement>;
	
	productNameAutofilled: boolean;

	dataLoaded: boolean = false;
	
	selected = 1;

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
		});
		
		this.loadData();
	}

	loadData() {
		this.getOrdersByRestaurant(this.selected).subscribe(data => {
		  this.dataSource.data = data.orders;
		});
	  }

	ngAfterViewInit(): void {
		this.dataSource.paginator = this.paginator;
	}
	

	search() {
		const inputValue = (this.productName.nativeElement as HTMLInputElement).value;
		this.getOrdersByRestaurant(this.selected, inputValue).subscribe(data => {
			this.dataSource.data = data.orders;
		  });
	  }

	restaurants: Restaurant[] = [
		{ value: 1, name: 'Restaurant 1' },
		{ value: 2, name: 'Restaurant 2' }
	];

	getRevenueByPeriod(): Observable<any[]> {
		return this.http.get<any>(`${BASE_ENDPOINT}/dashboards/revenue-period`);
	}

	getCurrentYear(): Observable<number> {
		return this.http.get<number>(`${BASE_ENDPOINT}/dashboards/current-year`);
	}

	getTopProductRevenue(): Observable<any> {
		return this.http.get<any>(`${BASE_ENDPOINT}/dashboards/top-product`)
	}

	getRestaurantRevenue(): Observable<any> {
		return this.http.get<any>(`${BASE_ENDPOINT}/dashboards/restaurant-revenue`)
	}

	getOrdersByRestaurant(type: number, searchText?: string): Observable<any>{
		return this.http.get<any>(`${BASE_ENDPOINT}/orders?type=${type}&searchText=${searchText}`)
	}

	ngOnDestroy() {
		this._autofill.stopMonitoring(this.productName);
	}
}

export interface Order {
	OrderNumber: number;
	OrderDate: Date;
	ItemName: string;
	Quantity: number;
	ProductPrice: number;
	TotalProducts: number;
}

export interface Restaurant {
	value: number;
	name: string;
}

const BASE_ENDPOINT: string = "https://localhost:7020/api";

const CHART_CONTAINER = [
	{ id: 'chartContainer1' },
	{ id: 'chartContainer2' },
	{ id: 'chartContainer3' },
	{ id: 'chartContainer4' }
]

const ORDER_COLUMN = ['Order Number', 'Order Date', 'Item Name', 'Quantity', 'Product Price', 'Total products'];