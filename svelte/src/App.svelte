<script>
	import Graph from './Graph.svelte';
	import IconButton from './IconButton.svelte';
	import Terminal from './pages/Terminal.svelte';
	import Status from './pages/Status.svelte';
	import Players from './pages/Players.svelte'
	import Login from './pages/Login.svelte'
	import Settings from './pages/Settings.svelte';
	
	let page = window.location.pathname;

	function changePage(url){
		page = url;
		history.pushState({}, "Web MC", url);
	}
	window.onpopstate = function() {
		page = window.location.pathname;
	}

	let source = new EventSource(`/api/status`);
	let isRestarting = false;
	let restartingReason = '';
	let restartingTime = 0;
	let restartingTimeInterval;
	let status;

	let stoppingTime = 0;
	let stoppingTimeInterval;
    source.onmessage = (event) => {
        const message = JSON.parse(event.data);
		if(message.type == 'restart'){
			status = "restarting";
			isRestarting = true;
			restartingReason = message.reason;
			restartingTime = message.time;
			restartingTimeInterval = setInterval(() => {
				restartingTime--;
			}, 1000);
		}
		else if(message.type == 'stop'){
			status = 'shutting-down';
			stoppingTime = message.time;
			stoppingTimeInterval = setInterval(() => {
				stoppingTime--;
			}, 1000);
		}
		else if(message.type == 'status'){
			status = message.status;
			if(status == 'offline'){
				clearInterval(stoppingTimeInterval);
			}
		}
		else if(message.type == 'started'){
			status = "online";
			clearInterval(restartingTimeInterval);
			isRestarting = false;
		}
    }
	source.onerror = event => {
		changePage('/login/');
	};

	let user;
	fetch('/api/admins')
		.then(res => res.json())
		.then(admins => {
			admins.forEach(el => {
				if(el.isYou){
					user = el;
				}
			});
		});
</script>

{#if page != "/login"}
	<div class="topbar" style="height: {60 + isRestarting * 30}px">
		<nav>
			<img src="/icons/webmclogo2.svg" alt="Web MC logo" width=50 height=50>
			<IconButton style="margin: 14px" src="/icons/activity.svg" on:click={()=>{changePage("/")}}></IconButton>
			<IconButton style="margin: 14px" src="/icons/users.svg" on:click={()=>{changePage("/players/")}}></IconButton>
			<IconButton style="margin: 14px" src="/icons/settings.svg" on:click={()=>{changePage("/settings/")}}></IconButton>
			<IconButton style="margin: 14px" src="/icons/terminal.svg" on:click={()=>{changePage("/terminal/")}}></IconButton>
		</nav>
		<div class="status">
			{#if isRestarting}
				{#if restartingTime > 0}
					<p>Server restarting in {restartingTime}s for: {restartingReason}</p>
				{:else}
					<p>Server restarting...</p>
				{/if}
			{:else if status == 'shutting-down'}
				{#if stoppingTime > 0}
					<p>Server shutting down in {stoppingTime}s</p>
				{:else}
					<p>Server shutting down...</p>
				{/if}
			{/if}
		</div>
	</div>
{/if}


<div style="height: {80 + isRestarting * 30}px"></div>

{#if page == "/"}
	<Status {user} {status}></Status>
{:else if page == "/players/"}
	<Players {user}></Players>
{:else if page == "/settings/"}
	<Settings {user}></Settings>
{:else if page == "/terminal/"}
	<Terminal {user}></Terminal>
{:else if page == "/login/"}
	<Login {user}></Login>
{/if}


<style>
	:global(body, html) {
		margin: 0;
		padding: 0;
		background-color: #121212;
		overflow-x: hidden;
		text-align: center;
	}
	.topbar{
		display: block;
		position: fixed;
		left: 0;
		top: 0;
		height: 90px;
		width: 100%;
		background-color: #222222;
		margin-bottom: 20px;
		text-align: center;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
		z-index: 100;
	}
	.status{
		display: block;
		width: 100%;
		height: 30px;
		text-align: center;
	}
	.status p{
		text-align: center;
		margin: auto;
	}
	nav {
		display: block;
		width: 100%;
	}
	img{
		width: 50px;
		height: 50px;
		position: fixed;
		left: 10px;
		top: 5px;
		display: block;
		z-index: 101;
	}
	p{
		color: rgba(207, 102, 121, 0.87);
	}
</style>