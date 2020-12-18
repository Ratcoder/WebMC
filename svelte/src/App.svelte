<script>
	import Graph from './Graph.svelte';
	import IconButton from './IconButton.svelte';
	import Terminal from './pages/Terminal.svelte';
	import Status from './pages/Status.svelte';
	import Players from './pages/Players.svelte'
	import Login from './pages/Login.svelte'
	import Settings from './pages/Settings.svelte';
	// import { fly, fade } from 'svelte/transition';
	

	let pluginDisplay;
	fetch(`/api/display.json`)
  		.then(response => response.json())
		.then(data => {pluginDisplay = data});

	
	let page = window.location.pathname;
	// const pageTransitionTime = 300;

	function changePage(url){
		isChangingPage = true;
		page = url;
		history.pushState({}, "Web MC", url);
	}
	window.onpopstate = function(event) {
		page = window.location.pathname;
		isChangingPage = true;
	}

	let isChangingPage = true;
</script>

{#if page != "/login"}
	<nav>
		<IconButton style="margin: 14px" src="/icons/activity.svg" on:click={()=>{changePage("/")}}></IconButton>
		<IconButton style="margin: 14px" src="/icons/users.svg" on:click={()=>{changePage("/players")}}></IconButton>
		<IconButton style="margin: 14px" src="/icons/settings.svg" on:click={()=>{changePage("/settings")}}></IconButton>
		<IconButton style="margin: 14px" src="/icons/terminal.svg" on:click={()=>{changePage("/terminal")}}></IconButton>
	</nav>
{/if}


<div style="height: 80px"></div>

{#if pluginDisplay}
	{#if page == "/"}
		<Status {pluginDisplay}></Status>
	{:else if page == "/players"}
		<Players {isChangingPage}></Players>
	{:else if page == "/settings"}
		<Settings {pluginDisplay}></Settings>
	{:else if page == "/terminal"}
		<Terminal></Terminal>
	{:else if page == "/login"}
		<Login></Login>
	{:else}
		sasdasdas
	{/if}
{/if}


<style>
	:global(body, html) {
		margin: 0;
		padding: 0;
		background-color: #121212;
		overflow-x: hidden;
		text-align: center;
	}

	/* h1 {
		color: rgba(255,255,255,0.87);
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
		text-align: center;
	} */
	nav{
		display: block;
		position: fixed;
		left: 0;
		top: 0;
		height: 60px;
		width: 100%;
		background-color: #222222;
		margin-bottom: 20px;
		text-align: center;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
		z-index: 100;
	}
	/* p{
		color: rgba(255,255,255,0.6);
	} */
	
</style>