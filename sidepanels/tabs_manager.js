const settingPopupPage = '../popups/popup.html';

const storage = chrome.storage.local;

let tabs = {};
let tabIds = [];

let focusedWindowId = undefined;
let currentWindowId = undefined;

let currentGroupId = undefined;
let groups = {};


async function bootstrap() {
	const currentWindow = await chrome.windows.getCurrent();
	currentWindowId = currentWindow.id;
	const focusedWindow = await chrome.windows.getLastFocused();
	focusedWindowId = focusedWindow.id;
	loadWindowList();
}

function isInt(i) {
	return typeof i == 'number' && !(i % 1) && !isNaN(i);
}

const windowTemplate = document.getElementById('windowItem').content;
const tabTemplate = document.getElementById('tabItem').content;
const groupTemplate = document.getElementById('groupItem').content;
const urlTemplate = document.getElementById('urlItem').content;

async function loadWindowList() {
	// group list
	// appendToLog("groups:");

	var items = await storage.get('SideTabGroups');
	if (items.SideTabGroups) {
		// appendToLog("items.SideTabGroups length: " + Object.keys(items.SideTabGroups).length);
		groups = {};
		for (const groupId of Object.keys(items.SideTabGroups)) {
			// appendToLog("groupId = " + groupId + " t=" + typeof groupId);
			if (isFinite(Number(groupId))) {
				// appendToLog("isInteger");
				groups[groupId] = items.SideTabGroups[groupId];
			}
		}
	}
	// appendToLog("groups length: " + Object.keys(groups).length);
	renderGroups();

	// window list
	const windowList = await chrome.windows.getAll({ populate: true });
	tabs = {};
	tabIds = [];
	for (let window of windowList) {
		for (let tab of window.tabs) {
			tabIds.push(tab.id);
			tabs[tab.id] = tab;
		}
	}

	const output = document.getElementById('windowList');
	output.innerHTML = '';

	for (let window of windowList) {
		const windowItem = document.importNode(windowTemplate, true).children[0];
		renderWindow(window, windowItem);
		registerWindowEvents(window, windowItem);

		output.appendChild(windowItem);
	}
}

function renderGroups() {
	const groupList = document.getElementById('groupList');
	groupList.innerHTML = '';
	for (const groupId of Object.keys(groups)) {
		const groupItem = document.importNode(groupTemplate, true).children[0];
		renderGroup(groupId, groupItem);
		registerGroupEvents(groupId, groupItem);
		groupList.appendChild(groupItem);
	}
}

function renderWindow(window, windowItem) {
	windowItem.id = `window_${window.id}`;
	// windowItem.querySelector('.window_left').id = `left_${window.id}`;
	// windowItem.querySelector('.window_top').id = `top_${window.id}`;
	// windowItem.querySelector('.window_width').id = `width_${window.id}`;
	// windowItem.querySelector('.window_height').id = `height_${window.id}`;
	// windowItem.querySelector('.window_focused').id = `focused_${window.id}`;
	// windowItem.querySelector('.window_current').id = `current_${window.id}`;
	// windowItem.querySelector('.window_id').innerText = window.id;
	// windowItem.querySelector('.window_left').value = window.left;
	// windowItem.querySelector('.window_top').value = window.top;
	// windowItem.querySelector('.window_width').value = window.width;
	// windowItem.querySelector('.window_height').value = window.height;
	// windowItem.querySelector('.window_focused').checked =
	// 	window.id == focusedWindowId;
	// windowItem.querySelector('.window_current').checked =
	// 	window.id == currentWindowId;

	windowItem.querySelector('#tabList').innerHTML = '';
	for (let tab of window.tabs) {
		const tabItem = document.importNode(tabTemplate, true).children[0];
		renderTab(tab, tabItem);
		registerTabEvents(tab, tabItem);
		windowItem.querySelector('#tabList').appendChild(tabItem);
	}
}

async function saveGroups() {
	await storage.set({ SideTabGroups: groups });
}

async function addNewGroup() {
	let nextGroupId = 0;
	for (const groupId of Object.keys(groups)) {
		const id = Number(groupId)
		if (isFinite(id) && id > nextGroupId) {
			nextGroupId = id;
		}
	}
	nextGroupId += 1;
	groups[nextGroupId] = { name: `new group ${nextGroupId}` };

	appendToLog("addNewGroup:" + Object.keys(groups).length);
	appendToLog(groups);
	await saveGroups();
	return nextGroupId;
}

async function addNewGroupItem() {
	// appendToLog("addNewGroupItem");
	const groupId = await addNewGroup();
	const groupItem = document.importNode(groupTemplate, true).children[0];
	groupItem.id = `groupItem_${groupId}`;
	renderGroup(groupId, groupItem);
	registerGroupEvents(groupId, groupItem);
	document.getElementById('groupList').appendChild(groupItem);
}

function registerWindowEvents(window, windowItem) {
	windowItem
		.querySelector('.window_refresh')
		.addEventListener('click', function () {
			refreshWindow(window.id);
		});

	// windowItem
	// 	.querySelector('.update_window_button')
	// 	.addEventListener('click', function () {
	// 		updateWindow(window.id);
	// 	});

	// windowItem
	// 	.querySelector('.remove_window_button')
	// 	.addEventListener('click', function () {
	// 		removeWindow(window.id);
	// 	});

	// windowItem
	// 	.querySelector('.refresh_active_tab_button')
	// 	.addEventListener('click', function () {
	// 		refreshActiveTab(window.id);
	// 	});
}

function renderTab(tab, tabItem) {
	tabItem.id = `tab_${tab.id}`;
	const button = tabItem.querySelector('.activate_tab_button');
	button.textContent = tab.title;
	button.style.backgroundColor = (tab.active) ? "#b0b8ff" : null;

// active,audible,autoDiscardable,discarded,favIconUrl,frozen,groupId,height,highlighted,id,incognito,index,lastAccessed,mutedInfo,pinned,selected,status,title,url,width,windowId
	// const props = Object.getOwnPropertyNames(tab);
	// appendToLog(props);
	
	if (tab.favIconUrl) {
		tabItem.querySelector('.tab_img').src = tab.favIconUrl;
	}

	const tab_url = tabItem.querySelector('.tab_url')
	tab_url.id = `url_${tab.id}`;
	tab_url.value = tab.url;

	// tabItem.querySelector('.tab_index').id = `index_${tab.id}`;
	// tabItem.querySelector('.tab_window_id').id = `windowId_${tab.id}`;
	// tabItem.querySelector('.tab_title').id = `title_${tab.id}`;
	
	// tabItem.querySelector('.tab_active').id = `active_${tab.id}`;

	// tabItem.querySelector('.tab_id').innerText = `TabId: ${tab.id}`;
	// tabItem.querySelector('.tab_index').value = tab.index;
	// tabItem.querySelector('.tab_window_id').value = tab.windowId;
	// tabItem.querySelector('.tab_title').value = tab.title;
	// tabItem.querySelector('.tab_active').checked = tab.active;
}

function renderGroup(groupId, groupItem) {
	const group = groups[groupId];

	const button = groupItem.querySelector('.activate_group_button');
	button.textContent = group.name;
	button.style.backgroundColor = (groupId == currentGroupId) ? "#b0b8ff" : null;

	groupItem.querySelector('.group-tab-count').innerText = "" + groupId;


	if ('urls' in group) {
		const urlList = groupItem.querySelector('#urlList');
		for (const url of group.urls) {
			const urlItem = document.importNode(urlTemplate, true).children[0];
			renderUrl(url, urlItem);
			registerUrlEvents(url, urlItem);
			urlList.appendChild(urlItem);
		}
	}
}

function renderUrl(url, urlItem) {
	urlItem.querySelector('.url_filter').value = url;
}

function registerTabEvents(tab, tabItem) {
	// tabItem
	// 	.querySelector('.move_tab_button')
	// 	.addEventListener('click', function () {
	// 		moveTab(tab.id);
	// 	});
	// tabItem
	// 	.querySelector('.refresh_tab_button')
	// 	.addEventListener('click', function () {
	// 		refreshTab(tab.id);
	// 	});
	// tabItem
	// 	.querySelector('.update_tab_button')
	// 	.addEventListener('click', function () {
	// 		updateTab(tab.id);
	// 	});
	tabItem
		.querySelector('.activate_tab_button')
		.addEventListener('click', function () {
			const active = true;
			chrome.tabs.update(tab.id, { active });
		});
	tabItem
		.querySelector('.settings_tab_button')
		.addEventListener('click', function () {
			const settings = tabItem.querySelector('.tab-item-settings');
			settings.hidden = !settings.hidden;
				// chrome.windows.create({
				// 	url: chrome.runtime.getURL(settingPopupPage),
				// 	type: "popup",
				// 	width: 400,
				// 	height: 600
				// });
		});
	tabItem
		.querySelector('.remove_tab_button')
		.addEventListener('click', function () {
			removeTab(tab.id);
		});
	// tabItem
	// 	.querySelector('.tab_active')
	// 	.addEventListener('change', function (event) {
	// 		const active = event.target.checked;
	// 		const tabId = parseInt(event.target.id.split('_')[1]);
	// 		chrome.tabs.update(tabId, { active });
	// 	});
}

function registerGroupEvents(groupId, groupItem) {
	groupItem
		.querySelector('.activate_group_button')
		.addEventListener('click', function () {
			currentGroupId = groupId;
			renderGroups();
		});
	groupItem
		.querySelector('.settings_group_button')
		.addEventListener('click', async function () {
			const settings = groupItem.querySelector('.group-item-settings');
			settings.hidden = !settings.hidden;
			const group_title = groupItem.querySelector('.group_title');
			if (settings.hidden) {
				groups[groupId].name = group_title.value;
				await saveGroups();
			}
			else {
				group_title.value = groups[groupId].name;
			}
			renderGroup(groupId, groupItem);
		});
	groupItem
		.querySelector('.remove_group_button')
		.addEventListener('click', async function () {
			delete groups[groupId];
			await saveGroups();
			renderGroups();
		});
	groupItem
		.querySelector('.add_url_button')
		.addEventListener('click', async function () {
			const group = groups[groupId];
			if ('urls' in group) {
				group.urls = [];
			}
			appendToLog(group.urls);
			group.urls.push("set url");
			renderGroup(groupId, groupItem);
		});
	// tabItem
	// 	.querySelector('.tab_active')
	// 	.addEventListener('change', function (event) {
	// 		const active = event.target.checked;
	// 		const tabId = parseInt(event.target.id.split('_')[1]);
	// 		chrome.tabs.update(tabId, { active });
	// 	});
}

function registerUrlEvents(url, urlItem) {
	urlItem
		.querySelector('.remove_url_button')
		.addEventListener('click', async function () {
			// TODO
			// delete groups[groupId];
			// await saveGroups();
			// renderGroups();
		});
}

function updateTabData(id) {
	const retval = {
		url: document.getElementById('url_' + id).value,
		active: document.getElementById('active_' + id).value ? true : false
	};

	return retval;
}

async function updateTab(id) {
	try {
		await chrome.tabs.update(id, updateTabData(id));
	} catch (e) {
		alert(e);
	}
}

function moveTabData(id) {
	return {
		index: parseInt(document.getElementById('index_' + id).value),
		windowId: parseInt(document.getElementById('windowId_' + id).value)
	};
}

function moveTab(id) {
	chrome.tabs.move(id, moveTabData(id)).catch(alert);
}

function createTabData() {
	return {
		windowId: parseInt(document.getElementById('window_id_new').value),
		url: document.getElementById('url_new').value,
		active: document.getElementById('active_new').checked
	};
}

function createTab() {
	const args = createTabData();

	if (!isInt(args.windowId)) delete args.windowId;
	if (!args.url) delete args.url;

	chrome.tabs.create(args).catch(alert);
}

// document
// 	.getElementById('create_tab_button')
// 	.addEventListener('click', createTab);

async function updateAll() {
	try {
		for (let i = 0; i < tabIds.length; i++) {
			await chrome.tabs.update(tabIds[i], updateTabData(tabIds[i]));
		}
	} catch (e) {
		alert(e);
	}
}

async function moveAll() {
	// appendToLog('moving all');
	try {
		for (let i = 0; i < tabIds.length; i++) {
			await chrome.tabs.move(tabIds[i], moveTabData(tabIds[i]));
		}
	} catch (e) {
		alert(e);
	}
}

function removeTab(tabId) {
	chrome.tabs
		.remove(tabId)
		.then(function () {
		// appendToLog('tab: ' + tabId + ' removed.');
		})
		.catch(alert);
}

function appendToLog(logLine) {
	document
		.getElementById('log')
		.appendChild(document.createElement('div')).innerText = '> ' + logLine;
}

function clearLog() {
	document.getElementById('log').innerText = '';
}

chrome.windows.onCreated.addListener(function (createInfo) {
	// appendToLog('windows.onCreated -- window: ' + createInfo.id);
	loadWindowList();
});

chrome.windows.onBoundsChanged.addListener(function (window) {
	// appendToLog('windows.onBoundsChanged -- window: ' + window.id);
	refreshWindow(window.id);
});

chrome.windows.onFocusChanged.addListener(function (windowId) {
	focusedWindowId = windowId;
	// appendToLog('windows.onFocusChanged -- window: ' + windowId);
	loadWindowList();
});

chrome.windows.onRemoved.addListener(function (windowId) {
	// appendToLog('windows.onRemoved -- window: ' + windowId);
	loadWindowList();
});

chrome.tabs.onCreated.addListener(function (tab) {
	// appendToLog(
	// 	'tabs.onCreated -- window: ' +
	// 	tab.windowId +
	// 	' tab: ' +
	// 	tab.id +
	// 	' title: ' +
	// 	tab.title +
	// 	' index ' +
	// 	tab.index +
	// 	' url ' +
	// 	tab.url
	// );
	loadWindowList();
});

chrome.tabs.onAttached.addListener(function (tabId, props) {
	// appendToLog(
	// 	'tabs.onAttached -- window: ' +
	// 	props.newWindowId +
	// 	' tab: ' +
	// 	tabId +
	// 	' index ' +
	// 	props.newPosition
	// );
	loadWindowList();
});

chrome.tabs.onMoved.addListener(function (tabId, props) {
	// appendToLog(
	// 	'tabs.onMoved -- window: ' +
	// 	props.windowId +
	// 	' tab: ' +
	// 	tabId +
	// 	' from ' +
	// 	props.fromIndex +
	// 	' to ' +
	// 	props.toIndex
	// );
	loadWindowList();
});

async function refreshTab(tabId) {
	const tab = await chrome.tabs.get(tabId);
	const output = document.getElementById('tab_' + tab.id);
	if (!output) return;
	renderTab(tab, output);
	// appendToLog('tab refreshed -- tabId: ' + tab.id + ' url: ' + tab.url);
}

chrome.tabs.onUpdated.addListener(function (tabId, props) {
	// appendToLog(
	// 	'tabs.onUpdated -- tab: ' +
	// 	tabId +
	// 	' status ' +
	// 	props.status +
	// 	' url ' +
	// 	props.url
	// );
	refreshTab(tabId);
});

chrome.tabs.onDetached.addListener(function (tabId, props) {
	// appendToLog(
	// 	'tabs.onDetached -- window: ' +
	// 	props.oldWindowId +
	// 	' tab: ' +
	// 	tabId +
	// 	' index ' +
	// 	props.oldPosition
	// );
	loadWindowList();
});

chrome.tabs.onActivated.addListener(function (props) {
	// appendToLog(
	// 	'tabs.onActivated -- window: ' + props.windowId + ' tab: ' + props.tabId
	// );
	loadWindowList();
});

chrome.tabs.onRemoved.addListener(function (tabId) {
	// appendToLog('tabs.onRemoved -- tab: ' + tabId);
	loadWindowList();
});

async function createWindow() {
	const args = {
		left: parseInt(document.getElementById('new_window_left').value),
		top: parseInt(document.getElementById('new_window_top').value),
		width: parseInt(document.getElementById('new_window_width').value),
		height: parseInt(document.getElementById('new_window_height').value),
		url: document.getElementById('new_window_url').value
	};

	if (!isInt(args.left)) delete args.left;
	if (!isInt(args.top)) delete args.top;
	if (!isInt(args.width)) delete args.width;
	if (!isInt(args.height)) delete args.height;
	if (!args.url) delete args.url;

	chrome.windows.create(args).catch(alert);
}

// document
// 	.getElementById('create_window_button')
// 	.addEventListener('click', createWindow);


document
	.getElementById('window_add_group')
	.addEventListener('click', addNewGroupItem);


async function refreshWindow(windowId) {
	const window = await chrome.windows.get(windowId);
	const tabList = await chrome.tabs.query({ windowId });
	window.tabs = tabList;
	const output = document.getElementById('window_' + window.id);
	if (!output) return;
	renderWindow(window, output);
}


function updateWindowData(id) {
	const retval = {
		left: parseInt(document.getElementById('left_' + id).value),
		top: parseInt(document.getElementById('top_' + id).value),
		width: parseInt(document.getElementById('width_' + id).value),
		height: parseInt(document.getElementById('height_' + id).value)
	};
	if (!isInt(retval.left)) delete retval.left;
	if (!isInt(retval.top)) delete retval.top;
	if (!isInt(retval.width)) delete retval.width;
	if (!isInt(retval.height)) delete retval.height;

	return retval;
}

function updateWindow(id) {
	chrome.windows.update(id, updateWindowData(id)).catch(alert);
}

function removeWindow(windowId) {
	chrome.windows
		.remove(windowId)
		// .then(function () {
		// 	appendToLog('window: ' + windowId + ' removed.');
		// })
		.catch(alert);
}

async function refreshActiveTab(windowId) {
	const tabs = await chrome.tabs.query({ active: true, windowId });
	const output = document.getElementById('tab_' + tabs[0].id);
	if (!output) return;
	renderTab(tabs[0], output);
	// appendToLog(
	// 	'Active tab refreshed -- tabId: ' + tabs[0].id + ' url:' + tabs[0].url
	// );
}

document.addEventListener('DOMContentLoaded', function () {
	bootstrap();
});

// document
// 	.getElementById('load_window_list_button')
// 	.addEventListener('click', function () {
// 		loadWindowList();
// 	});
// document
// 	.getElementById('update_all_button')
// 	.addEventListener('click', function () {
// 		updateAll();
// 	});
// document
// 	.getElementById('move_all_button')
// 	.addEventListener('click', function () {
// 		moveAll();
// 	});
// document
// 	.getElementById('clear_log_button')
// 	.addEventListener('click', function () {
// 		clearLog();
// 	});
// document
// 	.getElementById('new_window_button')
// 	.addEventListener('click', function () {
// 		chrome.windows.create();
// 	});


