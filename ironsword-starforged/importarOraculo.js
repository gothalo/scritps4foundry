const PREFIX = "Starforged_"

// Obtiene la descripción para una tabla a partir de los datos que recibimos en el Oraculo
function getTableDescription (oracle) {
	var tableDescription = "";

	if (oracle["Display name"] != undefined) {
    tableDescription += (oracle["Display name"] + "\n");
  }
  if (oracle["Description"] != undefined) {
  	tableDescription += (oracle["Description"] + "\n");
  }
  if (oracle["Requires"] != undefined) {
  	if(oracle["Requires"]["Environment"] != undefined) {
  		tableDescription += ("Environment : " + oracle["Requires"]["Environment"][0] + "\n");
  	}
  	if(oracle["Requires"]["Region"] != undefined) {
  		tableDescription += ("Region : " + oracle["Requires"]["Region"][0] + "\n");
  	}
  	if (oracle["Requires"]["Derelict Type"] != undefined) {
			tableDescription += ("Requires Derelict Type : " + oracle["Requires"]["Derelict Type"][0] + "\n");
		}
		if (oracle["Requires"]["Scale"] != undefined && oracle["Requires"]["Scale"].length > 0) {
			tableDescription += ("Requires Scale : " + oracle["Requires"]["Scale"][0]);
		}
		if (oracle["Requires"]["Starship Type"] != undefined && oracle["Requires"]["Starship Type"].length > 0) {
			tableDescription += ("Requires Starship type : " + oracle["Requires"]["Starship Type"][0]);
		}
		if (oracle["Requires"]["Location"] != undefined && oracle["Requires"]["Location"].length > 0) {
			tableDescription += ("Requires Location : " + oracle["Requires"]["Location"][0] + "\n");
		}
		if (oracle["Requires"]["Life"] != undefined && oracle["Requires"]["Life"].length > 0) {
			var lifeForms = "";
			var first = true;
			for (var life of oracle["Requires"]["Life"]) {
				if (first) {
					lifeForms = "Requires Life : " + life;
					first = false;
				}
				else {
					lifeForms += (", " + life);
				}
			}
			if (lifeForms != "") {
				tableDescription += lifeForms;
			}
		}
  }
  if (oracle["Use with"] != undefined && oracle["Use with"].length > 0) {
  	var useWith = "Use with :";
  	if (oracle["Use with"][0]["Category"] != undefined) {
			useWith += (" " + oracle["Use with"][0]["Category"]);
  	}
  	if (oracle["Use with"][0]["Name"] != undefined) {
			useWith += (" " + oracle["Use with"][0]["Name"]);
  	}
  	tableDescription += (useWith +'\n');
  }
  if (oracle["Min rolls"] != undefined) {
    tableDescription += ("Min rolls : " + oracle["Min rolls"] + " ");
  }
  if (oracle["Max rolls"] != undefined) {
    tableDescription += ("Max rolls : " + oracle["Max rolls"] + " ");
  }
  return tableDescription;
}

function getTableData (table) {
	var oracles = [];
	var rangeL = 1;

	for (const tableRow of table) {
		var rowDescription = tableRow.Description
		if (tableRow.Details != undefined) {
			rowDescription += ' (' + tableRow.Details + ')';
		}

		oracles.push ({
  		"range" : [rangeL, tableRow.Chance],
    	"text"  : rowDescription,
    	"type"  : 0  
  	});
  rangeL = tableRow.Chance + 1;
	}
	return oracles;
}

function getTableInfo (tableName, tableFormula, folderId) {
	var tableInfo = {
	  name : tableName,
	  formula : tableFormula,
	  replacement : true,
	  folder : folderId,
	};
	return tableInfo;
}

function getFolder (folderName, parent) {
	if (parent == null || parent == undefined) {
		parent = "";
	}
	var folder = game.folders.find(f => f.name === folderName);
	if (folder == null) {
		var folderData = {
			name : folderName,
			type : "RollTable",
			parent : parent,
		}
		folder = Folder.create (folderData);
	}
	return folder;
}

// crea una tabla de resultados para starforged en foundry
async function createOracle (folderId, name, rawData) {
	var tableFormula = "1d100";
	for (const oracle of rawData) {
		if (oracle.Table != undefined) {

			var tableName = name + ":" + oracle.Name;

			var table = game.tables.find (t=>t.name === tableName);
			
			if (table == null) {
				var tableDescription = getTableDescription (oracle);
	      var oracles = getTableData (oracle.Table);

		    if (oracles.length > 1) {
		    	var tableInfo = getTableInfo(tableName, tableFormula, folderId);

  				tableInfo.description = tableDescription;
  				tableInfo.permission = {"default" : 2};

    			table = await RollTable.create (tableInfo);
    			table.createEmbeddedDocuments("TableResult", oracles);
		    }
			} 
		}
		else if (oracle.Tables != undefined) {
			for (const oracleTable of  oracle.Tables) {
				var tableName = name + ":" + oracle.Name;

				if (oracleTable.Requires != null && oracleTable.Requires.Environment != null) {
					tableName += (" (" + oracleTable.Requires.Environment[0] + ")");
				}
				if (oracleTable.Requires != undefined) {
					if (oracleTable.Requires.Region != undefined && oracleTable.Requires.Region.length > 0) {
						tableName  += (" (" + oracleTable.Requires.Region[0] + ")");
					}
					if (oracleTable.Requires["Derelict Type"] != undefined && oracleTable.Requires["Derelict Type"].length > 0) {
						tableName += (" (" +  oracleTable.Requires["Derelict Type"][0] + ")");
					}
					if (oracleTable.Requires["Location"] != undefined && oracleTable.Requires["Location"].length > 0) {
						tableName += (" (" +  oracleTable.Requires["Location"][0] + ")");
					}	
					if (oracleTable.Requires["Life"] != undefined && oracleTable.Requires["Life"].length > 0) {
						tableName += (" (" + oracleTable.Requires["Life"][0] + ")")
					}			
				}

				var table = game.tables.find (t => t.name === tableName);

				if (table == null) {
					var tableDescription = getTableDescription (oracleTable);
					var oracles = getTableData (oracleTable.Table);

			    if (oracles.length > 1) {
			    	var tableInfo = getTableInfo(tableName, tableFormula, folderId);
		    	
						tableInfo.description = tableDescription;
						tableInfo.permission = {"default":2};

    				table = await RollTable.create (tableInfo);

    				table.createEmbeddedDocuments("TableResult", oracles);
					}
				}
			}
		}
	}
}

// creación de los oraculos. 
var oracleFolder = await getFolder("Starforged Oracles","");

var oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/core.json'
  ).then(x => x.json());
var folder = await getFolder ("Core", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/campaign.json'
  ).then(x => x.json());
folder = await getFolder ("Campaign", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/character.json'
  ).then(x => x.json());
folder = await getFolder ("Character", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/creature.json'
	).then(x => x.json());
folder = await getFolder ("Creature", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/misc.json'
	).then(x => x.json());
folder = await getFolder ("Misc", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/move.json'
  ).then(x => x.json());
folder = await getFolder ("Move", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/settlement.json'
	).then(x => x.json());
folder = await getFolder ( "Settlement", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/space.json'
	).then(x => x.json());
folder = await getFolder ("Space", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/starship.json'
	).then(x => x.json());
folder = await getFolder ("Starship", oracleFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

var planetFolder = await getFolder ("Planets", oracleFolder.id);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/planet.json'
	).then(x => x.json());
folder = await getFolder ("Common", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/desert.json'
	).then(x => x.json());
folder = await getFolder ("Desert", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/furnace.json'
	).then(x => x.json());
folder = await getFolder ("Furnace", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/grave.json'
	).then(x => x.json());
folder = await getFolder ("Grave", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/ice.json'
	).then(x => x.json());
folder = await getFolder ("Ice", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/jovian.json'
	).then(x => x.json());
folder = await getFolder ("Jovian", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/jungle.json'
	).then(x => x.json());
folder = await getFolder ("Jungle", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);	

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/rocky.json'
	).then(x => x.json());
folder = await getFolder ("Rocky", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);	

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/shattered.json'
	).then(x => x.json());
folder = await getFolder ("Shattered", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);	

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/tainted.json'
	).then(x => x.json());
folder = await getFolder ("Tainted", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);	

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/planet/vital.json'
	).then(x => x.json());
folder = await getFolder ("Vital", planetFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

var precursorVaultFolder = await getFolder("Precursor Vault", oracleFolder);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/precursor_vault/exterior.json'
	).then(x => x.json());
folder = await getFolder("Vault Exterior", precursorVaultFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/precursor_vault/interior.json'
	).then(x => x.json());
folder = await getFolder("Vault Interior", precursorVaultFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/precursor_vault/sanctum.json'
	).then(x => x.json());
folder = await getFolder("Sanctum", precursorVaultFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

var locationThemeFolder = await getFolder("Location Theme", oracleFolder);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/location_theme.json'
	).then(x => x.json());
createOracle (locationThemeFolder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/chaotic.json'
	).then(x => x.json());
folder = await getFolder("Chaotic", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/fortified.json'
	).then(x => x.json());
folder = await getFolder("Fortified", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/haunted.json'
	).then(x => x.json());
folder = await getFolder("Haunted", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/infested.json'
	).then(x => x.json());
folder = await getFolder("Infested", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/inhabited.json'
	).then(x => x.json());
folder = await getFolder("Inhabited", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/ruined.json'
	).then(x => x.json());
folder = await getFolder("Ruined", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/location_theme/sacred.json'
	).then(x => x.json());
folder = await getFolder("Sacred", locationThemeFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

var derelictFolder = await getFolder("Derelict", oracleFolder.id);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/exterior.json'
	).then(x => x.json());
folder = await getFolder("Derelict Exterior", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/interior.json'
	).then(x => x.json());
folder = await getFolder("Derelict Interior", derelictFolder.id);
createOracle (folder.id, oracleJson.Name + ' ' + oracleJson.Parent, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/access.json'
	).then(x => x.json());
folder = await getFolder("Zone Access", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/community.json'
	).then(x => x.json());
folder = await getFolder("Zone Community", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/engineering.json'
	).then(x => x.json());
folder = await getFolder("Zone Engineering", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/living.json'
	).then(x => x.json());
folder = await getFolder("Zone Living", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/medical.json'
	).then(x => x.json());
folder = await getFolder("Zone Medical", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/operations.json'
	).then(x => x.json());
folder = await getFolder("Zone Operations", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/production.json'
	).then(x => x.json());
folder = await getFolder("Zone Production", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

oracleJson = await fetch ('https://raw.githubusercontent.com/rsek/dataforged/main/oracles/derelict/zone/research.json'
	).then(x => x.json());
folder = await getFolder("Zone Research", derelictFolder.id);
createOracle (folder.id, oracleJson.Name, oracleJson.Oracles);

