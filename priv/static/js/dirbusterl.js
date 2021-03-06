function start_bust(e) {
	e.preventDefault();
	data = new Object();
	$.each(["url", "wordlist", "url_restriction"], function(n, e) {
		var value = document.getElementById(e).value;
		if (value) data[e] = value;
	});
	$.each(["follow_dirs", "follow_redirs", "parse_body"], function(n, e) {
		if (document.getElementById(e).checked) data[e] = true;
	});
	var socks5_host = document.getElementById("socks5_host").value;
	var socks5_port = document.getElementById("socks5_port").value;
	if (socks5_host && socks5_port) {
		data.http_cfg = {"socks5_host": socks5_host,
			"socks5_port": parseInt(socks5_port)};
		var socks5_user = document.getElementById("socks5_user").value;
		var socks5_pass = document.getElementById("socks5_pass").value;
		if (socks5_user && socks5_pass) {
			data.http_cfg.socks5_user = socks5_user;
			data.http_cfg.socks5_pass = socks5_pass;
		}
	}
	$.each(["mangle_found", "postfix"], function(n, e) {
		var value = document.getElementById(e).value;
		if (value) data[e] = value.split(/ *, */);
	});
	var headers = $("#bustHeaders tbody tr");
	if (headers.length != 0) {
		data["headers"] = Array();
		headers.each(function(n, e) {
			var header = $("td", e);
			data["headers"].push([header[0].innerHTML, header[1].innerHTML]);
		});
	}
	$.ajax({
		url: "/busts",
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
	$.getJSON("/busts", null, load_sessions_data);
}

function session_detail_clicked(event) {
	// TODO check for status updates
	update_session_params(event.data);
	update_session_findings(event.data.id);
	$('#detailsModal').modal({});
}

function update_session_findings(id) {
	$.getJSON("/busts/" + id + "/findings.json", null,
			load_session_findings).fail(session_fail);
}

function session_fail(jqxhr, textStatus, error) {
	var tbody = $("#detailsModal .detailsFindings tbody").empty();
	var tr = document.createElement("tr");
	var msg = document.createElement("td");
	msg.colSpan = 2;
	msg.appendChild(document.createTextNode("Couldn't load results: " + error));
	tr.appendChild(msg);
	tbody.append(tr);
}

function load_session_findings(findings) {
	var tbody = $("#detailsModal .detailsFindings tbody").empty();
	findings.sort(function(a, b) { return ((a.url < b.url) ? -1 : ((a.url > b.url) ? 1 : 0)) });
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
		else if (finding.redir) {
			code.appendChild(document.createTextNode(" "));
			var icon = document.createElement("span");
			icon.className = "glyphicon glyphicon-fast-forward";
			icon.title = "redirection";
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
		"status": {
			label: "Status",
			type: "status"
		},
		url_restriction: {
			label: "URL restriction",
			type: "string"
		},
		wordlist: {
			label: "Wordlist",
			type: "string"
		},
		postfix: {
			label: "Postfix",
			type: "list"
		},
		mangle_found: {
			label: "Mangling",
			type: "list"
		},
		headers: {
			label: "Headers",
			type: "list"
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
		},
		"socks5_host": {
			label: "SOCKS5 host",
			type: "string"
		},
		"socks5_port": {
			label: "SOCKS5 port",
			type: "string"
		},
		"socks5_user": {
			label: "SOCKS5 user",
			type: "string"
		}
	};
	var tbody = $("#detailsModal .detailsParams tbody").empty();
	$.each(settings, function(name, setting) {
		var tr = document.createElement("tr");
		var key = document.createElement("td");
		var value = document.createElement("td");
		key.appendChild(document.createTextNode(setting.label));
		config_value = config[name];
		if (!config_value && config.http_cfg) config_value = config.http_cfg[name];
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
			case "list":
				if (config_value == undefined || config_value.length == 0) {
					contents = document.createTextNode("(none)");
					value.className = "text-muted";
				} else {
					contents = document.createElement("div");
					$(config_value).each(function(n, item) {
						if (n) contents.appendChild(document.createTextNode(", "));
						code = document.createElement("code");
						if (name == "headers") item = item[0] + ": " + item[1];
						code.appendChild(document.createTextNode(item));
						contents.appendChild(code);
					});
				}
				break;
			case "url":
				contents = document.createElement("a");
				contents.href = config_value;
				contents.appendChild(document.createTextNode(config_value));
				break;
			case "status":
				switch (config_value) {
					case "running":
						contents = document.createTextNode("running");
						break;
					case "finished":
						contents = document.createTextNode("finished");
						break;
					case "not_started":
						contents = document.createTextNode("waiting to start");
						break;
					default:
						contents = document.createElement("pre");
						contents.appendChild(document.createTextNode(config_value));
						break;
				}
				break;
		}
		value.appendChild(contents);
		tr.appendChild(key);
		tr.appendChild(value);
		tbody.append(tr);
	});
}

function session_abort_clicked(event) {
	$.ajax({
		url: "/busts/" + event.data.id,
		type: "PUT",
		data: '{"status": "aborted"}',
		contentType: "application/json",
		complete: function() { update_status(event.data.id); }
	});
}

var id_tr_map = {};

function load_sessions_data(sessions) {
	var tbody = $("#sessions tbody").empty();
	sessions.sort(function(a, b) { return ((a.started < b.started) ? 1 : ((a.started > b.started) ? -1 : 0)) });
	$(sessions).each(function (n, session) {
		var tr = document.createElement("tr");
		var id = document.createElement("td");
		var started = document.createElement("td");
		var url = document.createElement("td");
		var a = document.createElement("a");
		var st = document.createElement("td");
		var details = document.createElement("td");
		var button = document.createElement("a");
		id.className = "bust_id";
		id.appendChild(document.createTextNode(session.id));
		id_tr_map[session.id] = tr;
		started.appendChild(document.createTextNode(session.started));
		a.appendChild(document.createTextNode(session.url));
		a.href = session.url;
		url.appendChild(a);
		tr.appendChild(id);
		tr.appendChild(started);
		tr.appendChild(url);
		set_tr_status(tr, st, session);
		tr.appendChild(st);
		button.className = "btn btn-info btn-xs";
		button.appendChild(document.createTextNode("Details"));
		details.appendChild(button);
		$(button).on("click", null, session, session_detail_clicked);
		if (session.status == "running") {
			button = document.createElement("a");
			button.className = "btn btn-danger btn-xs session-abort";
			button.appendChild(document.createTextNode("Abort"));
			details.appendChild(document.createTextNode(" "));
			details.appendChild(button);
			$(button).on("click", null, session, session_abort_clicked);
		}
		tr.appendChild(details);
		tbody.append(tr);
	});
}

var last_reqs = null;

function set_tr_status(tr, st, session) {
	var may_change = false;
	switch (session.status) {
		case "running":
			tr.className = "active";
			var stats = document.createElement("div");
			stats.appendChild(document.createTextNode(
						"running (" + session.requests.join(" / ") + " requests)" +
						(last_reqs == null ? "" :
						 " " + format_perfdata(session.requests))));
			last_reqs = session.requests;
			st.appendChild(create_progressbar(session.requests));
			st.appendChild(stats);
			may_change = true;
			break;
		case "finished":
			tr.className = "success";
			st.appendChild(document.createTextNode("finished at " + session.ended));
			break;
		case "not_started":
			tr.className = "warning";
			st.appendChild(document.createTextNode("waiting to start"));
			may_change = true;
			break;
		default:
			tr.className = "danger";
			st.appendChild(document.createTextNode("aborted at " + session.ended));
			may_change = (session.ended == null);
			break;
	}
	if (may_change) setTimeout("update_status('" + session.id + "')", 330);
}

function format_perfdata(reqs) {
	rps = (reqs[0] - last_reqs[0]) * 3;
	if (rps == 0) return "stalled";
	return (rps + " req/s, " + Math.round((reqs[2] - reqs[0]) / rps) + " s remaining");
}

function update_status(id) {
	$.getJSON("/busts/" + id, null, function(stat) {
		var tr = id_tr_map[id];
		var td = tr.children[3];
		$(td).empty();
		if (stat.status != "running") {
			$(".session-abort", tr.children[4]).remove();
		}
		stat.id = id;
		set_tr_status(tr, td, stat);
	});
}

function create_progressbar(reqs) {
	var total = reqs[2];
	var bars = ["success", "warning"];
	var progress = document.createElement("div");
	var width = 0;
	progress.style.marginBottom = "4px";
	progress.className = "progress progress-striped";
	$(bars).each(function (pos, color) {
		var bar = document.createElement("div");
		bar.className = "progress-bar progress-bar-" + color;
		width = reqs[pos] * 100 / total - width;
		bar.style.width = Math.round(width) + "%";
		progress.appendChild(bar);
	});
	return progress;
}

function load_wordlists() {
	$.getJSON("/wordlists", null, load_wordlists_data);
}

function load_wordlists_data(wordlists) {
	var ul = $("#wldropdown").empty();
	$(wordlists).each(function (n, wordlist) {
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = '#';
		a.appendChild(document.createTextNode(wordlist));
		$(a).on("click", null, wordlist, wordlist_selected);
		li.appendChild(a);
		ul.append(li);
	});
}

function wordlist_selected(event) {
	document.getElementById("wordlist").value = event.data;
}

function url_restriction_selected(event) {
	document.getElementById("url_restriction").value = event.data;
}

function url_changed(event) {
	var url = event.target.value.split("/");
	var ul = $("#urdropdown").empty();
	if (url.length < 3) {
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = '#';
		a.appendChild(document.createTextNode("(invalid URL)"));
		li.appendChild(a);
		ul.append(li);
	} else {
		var res = new Array();
		var host = url[2].split(":");
		if (host.length == 2) {
			res.push(url[0] + "//" + host[0]);
		}
		for (var i = 3; i <= url.length; i++) {
			res.push(url.slice(0, i).join("/"));
		}
		$(res).each(function(n, re) {
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = '#';
			re = "^" + re.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
			a.appendChild(document.createTextNode(re));
			$(a).on("click", null, re, url_restriction_selected);
			li.appendChild(a);
			ul.append(li);
		});
	}
}

function postfix_selected(event) {
	var postfix = "." + event.data;
	var field = document.getElementById("postfix");
	var idx = field.value.indexOf(postfix);
	if (idx != -1) {
		if (idx == field.value.length - postfix.length) {
			field.value = field.value.replace(new RegExp(
				"[, ]*" + postfix.replace(".", "\\.")), "");
		} else {
			field.value = field.value.replace(new RegExp(
				postfix.replace(".", "\\.") + "[, ]*"), "");
		}
	} else {
		if (field.value) postfix = ", " + postfix;
		field.value += postfix;
	}
	return false;
}

function fill_postfixes() {
	var ul = $("#pfdropdown").empty();
	$("asp,aspx,html,jsp,php".split(",")).each(function (n, postfix) {
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = '#';
		a.appendChild(document.createTextNode(postfix));
		$(a).on("click", null, postfix, postfix_selected);
		li.appendChild(a);
		ul.append(li);
	});
}

function mangling_selected(event) {
	var rule = event.data;
	var field = document.getElementById("mangle_found");
	var idx = field.value.indexOf(rule);
	if (idx != -1) {
		if (idx == field.value.length - rule.length) {
			field.value = field.value.replace(new RegExp(
				"[, ]*" + rule.replace("\\", "\\\\").replace(".", "\\.")), "");
		} else {
			field.value = field.value.replace(new RegExp(
				rule.replace("\\", "\\\\").replace(".", "\\.") + "[, ]*"), "");
		}
	} else {
		if (field.value) rule = ", " + rule;
		field.value += rule;
	}
	return false;
}

function fill_manglings() {
	var ul = $("#mfdropdown").empty();
	$("\\1~,.\\1.swp,\\1.old,\\1.orig".split(",")).each(function (n, rule) {
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = '#';
		a.appendChild(document.createTextNode(rule));
		$(a).on("click", null, rule, mangling_selected);
		li.appendChild(a);
		ul.append(li);
	});
}

function remove_bust_header(event) {
	event.data.remove();
}

function add_bust_header() {
	var key = document.getElementById("bustHeaderKey");
	var value = document.getElementById("bustHeaderValue");
	var row = document.createElement("tr");
	var key_col = document.createElement("td");
	var value_col = document.createElement("td");
	var btn_col = document.createElement("td");
	var button = document.createElement("a");
	key_col.appendChild(document.createTextNode(key.value));
	value_col.appendChild(document.createTextNode(value.value));
	button.className = "btn btn-danger btn-xs";
	button.appendChild(document.createTextNode("Remove"));
	$(button).on("click", null, row, remove_bust_header);
	btn_col.appendChild(button);
	row.appendChild(key_col);
	row.appendChild(value_col);
	row.appendChild(btn_col);
	$("#bustHeaders tbody").append(row);
	key.value = "";
	value.value = "";
}

$(function() {
	$("#bust").submit(start_bust);
	load_wordlists();
	load_sessions();
	fill_postfixes();
	fill_manglings();
	url_changed({target: {value: ""}});
	$("#url").on("change", null, null, url_changed);
	$("#bustHeaderAdd").on("click", null, null, add_bust_header);
});
