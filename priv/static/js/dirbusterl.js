function start_bust(e) {
    e.preventDefault();
	data = new Object();
	$.each(["url", "wordlist"], function(n, e) {
		data[e] = document.getElementById(e).value;
	});
	$.ajax({
		url: "/bust",
		type: "POST",
		data: JSON.stringify(data),
		contentType: "application/json",
		statusCode: {
			201: function() {
				load_sessions();
			}
		}
	});
}

function load_sessions() {
	$.getJSON("/bust", null, load_sessions_data);
}

function session_detail_clicked(event) {
	update_session_params(event.data);
	update_session_findings(event.data.id);
	$('#detailsModal').modal({});
}

function update_session_findings(id) {
	$.getJSON("/bust/" + id, null, load_session_findings);
}

function load_session_findings(findings) {
	var tbody = $("#detailsModal .detailsFindings tbody").empty();
	$(findings).each(function (n, finding) {
		var tr = document.createElement("tr");
		var code = document.createElement("td");
		var url = document.createElement("td");
		var a = document.createElement("a");
		code.appendChild(document.createTextNode(finding.code));
		a.appendChild(document.createTextNode(finding.url));
		if (finding.dir) {
			code.appendChild(document.createTextNode(" "));
			var icon = document.createElement("span");
			icon.className = "glyphicon glyphicon-folder-open";
			icon.title = "directory";
			code.appendChild(icon);
		}
		a.href = finding.url;
		url.appendChild(a);
		tr.appendChild(code);
		tr.appendChild(url);
		tbody.append(tr);
	});
}

function update_session_params(config) {
	var settings = {
		url: {
			label: "URL",
			type: "url"
		},
		id: {
			label: "ID",
			type: "string"
		},
		url_restriction: {
			label: "URL restriction",
			type: "string"
		},
		wordlist: {
			label: "Wordlist",
			type: "string"
		},
		parse_body: {
			label: "Parse response body",
			type: "flag"
		},
		follow_redirs: {
			label: "Follow redirections",
			type: "flag"
		},
		follow_dirs: {
			label: "Recursively bust directories",
			type: "flag"
		}
	};
	var tbody = $("#detailsModal .detailsParams tbody").empty();
	$.each(settings, function(name, setting) {
		var tr = document.createElement("tr");
		var key = document.createElement("td");
		var value = document.createElement("td");
		key.appendChild(document.createTextNode(setting.label));
		config_value = config[name];
		switch (setting.type) {
			case "flag":
				var icon = document.createElement("span");
				icon.className = "glyphicon glyphicon-" + (config_value ? "ok" : "remove");
				value.appendChild(icon);
				contents = document.createTextNode(" " + (config_value ? "en" : "dis") + "abled");
				break;
			case "string":
				if (config_value == undefined) {
					contents = document.createTextNode("(none)");
					value.className = "text-muted";
				} else {
					contents = document.createElement("code");
					contents.appendChild(document.createTextNode(config_value));
				}
				break;
			case "url":
				contents = document.createElement("a");
				contents.href = config_value;
				contents.appendChild(document.createTextNode(config_value));
				break;
		}
		value.appendChild(contents);
		tr.appendChild(key);
		tr.appendChild(value);
		tbody.append(tr);
	});
}

function load_sessions_data(sessions) {
	var tbody = $("#sessions tbody").empty();
	$(sessions).each(function (n, session) {
		var tr = document.createElement("tr");
		var id = document.createElement("td");
		var url = document.createElement("td");
		var a = document.createElement("a");
		var st = document.createElement("td");
		var details = document.createElement("td");
		var button = document.createElement("a");
		id.className = "bust_id";
		id.appendChild(document.createTextNode(session.id));
		a.appendChild(document.createTextNode(session.url));
		a.href = session.url;
		url.appendChild(a);
		tr.appendChild(id);
		tr.appendChild(url);
		switch (session.status) {
			case "broken":
				tr.className = "danger";
				st.appendChild(document.createTextNode("internal error"));
				break;
			case "running":
				tr.className = "active";
				st.appendChild(document.createTextNode("running"));
				break;
			case "finished":
				tr.className = "success";
				st.appendChild(document.createTextNode("finished"));
				break;
			case "not_started":
				tr.className = "warning";
				st.appendChild(document.createTextNode("waiting to start"));
				break;
		}
		tr.appendChild(st);
		button.className = "btn btn-info btn-xs";
		button.appendChild(document.createTextNode("Details"));
		details.appendChild(button);
		tr.appendChild(details);
		tbody.append(tr);
		$(button).on("click", null, session, session_detail_clicked);
	});
}

$(function() {
    $("#bust").submit(start_bust);
	load_sessions();
});
