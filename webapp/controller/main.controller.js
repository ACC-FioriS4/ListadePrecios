sap.ui.define([
'jquery.sap.global',
		'sap/m/MessageToast',
		'sap/ui/core/Fragment',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		"sap/m/Dialog",
		"sap/m/Button"
	
	], function(jQuery, MessageToast, Fragment, Controller, Filter, Dialog, Button)  {
	"use strict";

	return Controller.extend("com.lista.precios.controller.main", {
		
		onInit: function(){
		
		this.getSplitAppObj().setHomeIcon({
				'phone':'phone-icon.png',
				'tablet':'tablet-icon.png',
				'icon':'desktop.ico'
			});	
			
			//Inicializar Lenguaje
			this.langSystem = sap.ui.getCore().getConfiguration().getLanguage();
			
			//Inicializar formato
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
			this.numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: false,
				groupingSeparator: "",
				decimalSeparator: "."
			});
			
			//inicializar Control de Vistas
			this.gasStation = this.getView().byId("gasStation");
			this.materialList = this.getView().byId("materialList");
			this.PriceList = this.getView().byId("PriceList");
			this.material = this.getView().byId("detailmat");
			
			//Inicializar Binding
			var ServiceUrl = "/sap/opu/odata/sap/ZSDGW_SO_CREATE_SRV_01/CustomerSet('')?$format=json";
			this.oModelId = new sap.ui.model.json.JSONModel();
			this.oModelId.loadData(ServiceUrl);
			
			var that = this;
			this.control = "init";
			
			this.oModelId.attachRequestCompleted(function() {
				/*that.Customer = that.oModelId.getProperty("/d/BillTo");
				that.Name1 = that.oModelId.getProperty("/d/Name1"); //Posiblemente no se utilice
				that.Name2 = that.oModelId.getProperty("/d/Name2"); //Posiblemente no se utilice*/
				that.supportEmail = that.oModelId.getProperty("/d/Email");
				that.supportPhone = that.oModelId.getProperty("/d/Phone");
			});
			
			var Url = "/sap/opu/odata/sap/ZSDGW_MATERIAL_PRICING_SRV/Ship_ToSet()?$format=json";
			this.oModelShip = new sap.ui.model.json.JSONModel();
			this.oModelShip.loadData(Url);
			this.oModelShip.refresh(true);
			
			this.oModelMaterial	= new sap.ui.model.json.JSONModel(); //JSON materiales
			
				this.oModelShip.attachRequestCompleted(function() {
					
				that.gasStation.setModel(that.oModelShip, "modelGasStation");	
				that.ShipTo = that.oModelShip.getProperty("/d/results/0/ShipTo");
				that.SalesOrg = that.oModelShip.getProperty("/d/results/0/SalesOrg");
				that.DistrChan = that.oModelShip.getProperty("/d/results/0/DistrChan");
				that.Plant = that.oModelShip.getProperty("/d/results/0/Plant");
				/*that.ShipCond = that.oModelShip.getProperty("/d/results/0/ShipCond");
				that.ShipDesc = that.oModelShip.getProperty("/d/results/0/ShipDesc");
				that.PlantDesc = that.oModelShip.getProperty("/d/results/0/PlantDesc");
				that.Name1 = that.oModelShip.getProperty("/d/results/0/Name1");
				that.Street = that.oModelShip.getProperty("/d/results/0/Street");
				that.City = that.oModelShip.getProperty("/d/results/0/City");*/
				//console.log("Ver ShipTo: " + that.ShipTo);

				var sServiceUrl = "/sap/opu/odata/sap/ZSDGW_MATERIAL_PRICING_SRV/MaterialsSet?$filter=(SalesOrg eq '" + that.SalesOrg + "' and DistrChan eq '" + that.DistrChan + "' and Plant eq '" + that.Plant + "')&$format=json";
				that.oModelMaterial.loadData(sServiceUrl);
				that.oModelMaterial.refresh(true);
				that.materialList.setModel(that.oModelMaterial, "modelMaterialList"); 
				}); 
			
				
				},
	
	
		
			
		onOrientationChange: function(oEvent) {
			var bLandscapeOrientation = oEvent.getParameter("landscape"),
				sMsg = "Orientation now is: " + (bLandscapeOrientation ? "Landscape" : "Portrait");
			MessageToast.show(sMsg, {duration: 5000});
		},

		onPressNavToDetail : function(oEvent) {
			this.getSplitAppObj().to(this.createId("detailDetail"));
		},

		onPressDetailBack : function() {
			this.getSplitAppObj().backDetail();
		},

		onPressMasterBack : function() {
			this.getSplitAppObj().backMaster();
		},


		onPressGoToMaster : function() {
			this.getSplitAppObj().toMaster(this.createId("master2"));
		},

		onListItemPress : function(oEvent) {
			var sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();
			this.getSplitAppObj().toDetail(this.createId(sToPageId));
	
			//Get Properties for the ConditionsSet
			this.Material = oEvent.getParameter("listItem").getCustomData()[1].getValue();
			this.MaterialDescription = oEvent.getParameter("listItem").getCustomData()[2].getValue();
			this.getView().byId("detailmat").setText(this.MaterialDescription); //Colocar Material a visualizar
			//console.log("Ver Material: " + this.Material + " y Descripción: " + this.MaterialDescription);
			
			var serviceUrl = "/sap/opu/odata/sap/ZSDGW_MATERIAL_PRICING_SRV/ConditionsSet?$filter=(SalesOrg eq '" + this.SalesOrg + "' and DistrChan eq '" + this.DistrChan + "' and Plant eq '" + this.Plant + "' and Customer eq '" + this.ShipTo + "' and Material eq '" + this.Material + "')&$format=json"; 
			this.oModelprecios = new sap.ui.model.json.JSONModel();
			this.oModelprecios.loadData(serviceUrl);
			var that = this;
			
			this.dataConditions = [];	
				this.oModelprecios.attachRequestCompleted(function() {
			
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
					maxFractionDigits: 2,
					groupingEnabled: true,
					groupingSeparator: ",",
					decimalSeparator: "."
						});
				var dataPrices = that.oModelprecios.getData();
				var Total = 0;
					Total = Number(oNumberFormat.format(Total));
				var j = 0;
						
				if (dataPrices.d.results[j].CondType === "ZPRB"){
					//that.getView().byId("detail").setVisible(true);
					var PrecioInicial = Number(oNumberFormat.format(dataPrices.d.results[j].CondValue));
					
				//Show Conditions
					
					for (var i = 0; i < dataPrices.d.results.length; i++) {
					
						switch (dataPrices.d.results[i].CondType){
			
							case "ZPRB":
							Total = Total + Number(oNumberFormat.format(dataPrices.d.results[i].CondValue));
							var PBase = "$" + oNumberFormat.format(dataPrices.d.results[i].CondValue);
								break;
			
							case "KF00":
							Total = Total + Number(oNumberFormat.format(dataPrices.d.results[i].CondValue));
							PrecioInicial = PrecioInicial + Number(oNumberFormat.format(dataPrices.d.results[i].CondValue));
							var Flete = "$" + oNumberFormat.format(dataPrices.d.results[i].CondValue);
								break;
			
							case "MX02":
							Total =  Total + (Number(dataPrices.d.results[i].CondValue) / Number(dataPrices.d.results[i].CondPUnt));
							Total = oNumberFormat.format(Total);	
							var NIEPS = "$" + (Number(dataPrices.d.results[i].CondValue) / Number(dataPrices.d.results[i].CondPUnt));
								break;
			
							case "MWST":
							Total =  Total * Number(dataPrices.d.results[i].CondValue / 100);
							Total = oNumberFormat.format(Total);
							var IVA = "$" + Total;
								break;
			
							case "MX03":
							/*Total =  Number(Total) + Number(dataPrices.d.results[i].CondValue / 100);
							Total = oNumberFormat.format(Total);*/
							var IEPS = "$" + (Number(dataPrices.d.results[i].CondValue) / Number(dataPrices.d.results[i].CondPUnt));
								break;
				}
		}
							
							Total = PrecioInicial + Number(Total);
							Total = oNumberFormat.format(Total);
							that.dataConditions.push({
									ImporteBase: PBase,
									ImporteFlete: Flete,
									NIEPS: NIEPS,
									Tax:	IVA,
									IEPS: IEPS,
									Unit: dataPrices.d.results[0].CondPUnt,
									Measure: dataPrices.d.results[0].CondUnit,
									Currency: dataPrices.d.results[0].Currency,
									Total: "$" + Total
							});	
						
							that.oModelConditions  = new sap.ui.model.json.JSONModel();
							that.oModelConditions.setData(that.dataConditions);
							that.PriceList.setModel(that.oModelConditions,"Conditions");
				} else {
					
					this.onPriceNull(this.materialList.getSelectedItem(),this.materialList.getSelectedItem().data("UnitSales"));
				}
	
		});	
				 
		},
		

		onPressModeBtn : function(oEvent) {
			var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();

			this.getSplitAppObj().setMode(sSplitAppMode);
			MessageToast.show("Split Container mode is changed to: " + sSplitAppMode, {duration: 5000});
		},

		getSplitAppObj : function() {
			var result = this.byId("SplitAppDemo");
			if (!result) {
				jQuery.sap.log.info("SplitApp object can't be found");
			}
			return result;
		},
		
		onPriceNull: function(item,AoF) {
			if (AoF === "L"){
			var popTitle = this.getView().getModel("i18n").getResourceBundle().getText("popTitleF");
			}else {
			var popTitle = this.getView().getModel("i18n").getResourceBundle().getText("popTitleA");	
			}
			var mailBtn = this.getView().getModel("i18n").getResourceBundle().getText("mailSend");
			var endBtn = this.getView().getModel("i18n").getResourceBundle().getText("endBtn");
			var placeHolderCommentMail = this.getView().getModel("i18n").getResourceBundle().getText("phCommentMail");
			var _supportMail = this.supportEmail;
			var _Material = this.Material;
			var _Description = this.MaterialDescription;
			var _shipTo = this.ShipTo;
			var matDesc = _Material + " - " + _Description;
		//	console.log("aquí");
			var _fullNameUser = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
		//	console.log("fullnameuser");
		//	console.log(_fullNameUser);
			var msgPopHeader = this.getView().getModel("i18n").getResourceBundle().getText("msgPopHeader") + " " + _fullNameUser + ";\n\n";
		//	var msgActual = this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_1") + " " + _supportMail;
			var msgPopBody = msgPopBody + " " + this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_2") + "\n\n";
			 msgPopBody = this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_1") + " ";
			msgPopBody = msgPopBody + " " + this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_2") + "\n\n";
			//msgPopBody = msgPopBody + this.getView().getModel("i18n").getResourceBundle().getText("material") + " : " + _Material + "\n";
		//	msgPopBody = msgPopBody + this.getView().getModel("i18n").getResourceBundle().getText("client") + " : " + _shipTo + "\n\n";
			msgPopBody = msgPopBody + this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_3");
			msgPopBody = msgPopBody + _supportMail + " " + this.getView().getModel("i18n").getResourceBundle().getText("msgPopBody_4") + this.supportPhone;
			var msgMail = msgPopHeader + msgPopBody;
			//alert(msgMail)
			var dialog = new Dialog({
				title: popTitle,
				type: "Message",
				content: new Text({
					text: msgMail
				}),
				beginButton: new Button({
					text: endBtn,
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		}

	});

	});