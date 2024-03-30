import { AfterViewInit, Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { Observable, from } from 'rxjs';
import axios from 'axios';
import { map } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSnackBar } from '@angular/material/snack-bar';

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
		HttpClientModule,
		MatProgressSpinnerModule,
		MatSortModule
	],
	providers: [DatePipe],
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

	@ViewChild(MatSort) sort: MatSort;

	productNameAutofilled: boolean;

	isLoadingOrder: boolean = true;

	selected = 1;

	formattedDate: string | null;

	BASE_ENDPOINT: string = "https://localhost:7020/api";

	isExporting: boolean = false;

	constructor(private datePipe: DatePipe, 
		private _autofill: AutofillMonitor, 
		private http: HttpClient, 
		private _liveAnnouncer: LiveAnnouncer,
		private _snackBar: MatSnackBar) { }

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
		this.getOrdersByRestaurant(this.selected).pipe(
			map(data => {
				data.forEach((order: any) => {
					order.orderDate = this.datePipe.transform(order.orderDate, 'dd-MM-yyyy HH:mm');
				});
				return data;
			})
		).subscribe(data => {
			this.isLoadingOrder = false;
			this.dataSource.data = data;
		},
			() => this.isLoadingOrder = false
		);
	}

	export() {
		this.isExporting = true;
		this.exportOrders().subscribe(response => {
			const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'restaurant_data.xlsx';
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			this.isExporting = false;
			this.showNotification('Export Successful');
		  },
		  error => {
			this.isExporting = false;
			console.error('Export failed', error);
			this.showNotification('Export Failed');
		  }
		);
	}

	showNotification(message: string) {
		this._snackBar.open(message, 'Close', {
			duration: 3000,
			horizontalPosition: 'end',
			verticalPosition: 'top'
		});
	}
	
	ngAfterViewInit(): void {
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort = this.sort;
	}

	announceSortChange(sortState: Sort) {
		if (sortState.direction) {
			this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
		} else {
			this._liveAnnouncer.announce('Sorting cleared');
		}
	}

	search() {
		this.dataSource.data = [];
		this.isLoadingOrder = true;
		const inputValue = (this.productName.nativeElement as HTMLInputElement).value;
		this.getOrdersByRestaurant(this.selected, inputValue)
			.pipe(
				map(data => {
					data.forEach((order: any) => {
						order.orderDate = this.datePipe.transform(order.orderDate, 'dd-MM-yyyy HH:mm');
					});
					return data;
				}))
			.subscribe(data => {
				this.isLoadingOrder = false;
				this.dataSource.data = data;
			},
				() => this.isLoadingOrder = false
			);
	}

	restaurants: Restaurant[] = [
		{ value: 1, name: 'Restaurant 1' },
		{ value: 2, name: 'Restaurant 2' }
	];

	getRevenueByPeriod(): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/dashboards/revenue-period`))
			.pipe(
				map(response => response.data)
			);
	}

	getCurrentYear(): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/dashboards/current-year`))
			.pipe(
				map(response => response.data)
			);
	}

	getTopProductRevenue(): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/dashboards/top-product`))
			.pipe(
				map(response => response.data)
			)
	}

	getRestaurantRevenue(): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/dashboards/restaurant-revenue`))
			.pipe(
				map(response => response.data)
			)
	}

	getOrdersByRestaurant(type: number, searchText?: string): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/orders?type=${type}&searchText=${searchText}`))
			.pipe(
				map(response => response.data)
			)
	}

	exportOrders(): Observable<any> {
		return from(axios.get(`${this.BASE_ENDPOINT}/orders/export`))
			.pipe(
				map(response => response.data)
			)
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

const CHART_CONTAINER = [
	{ id: 'chartContainer1' },
	{ id: 'chartContainer2' },
	{ id: 'chartContainer3' },
	{ id: 'chartContainer4' }
]

const ORDER_COLUMN = ['orderNumber', 'orderDate', 'itemName', 'quantity', 'productPrice', 'totalProducts'];