<script>
	export let src;
	export let style;
	export let disabled;
	export let title;
</script>

<style>
    button {
		background-color: transparent;
		width: 32px;
		height: 32px;
		border: none;
		padding: 0;
		font: inherit;
		-webkit-appearance: none;
		/* margin:14px; */
		vertical-align: top;
	}
    button:disabled img{
        opacity: 0.5;
    }
	button:hover:not(:disabled){
		transform: scale(1.2);
	}
	button:active:not(:disabled){
		border: none;
		outline: none;
		transform: scale(0.9);
	}
	button img{
		width:100%;
		height:100%;
		margin:0;
	}
</style>

<button {style} {title} on:click {disabled}>
    <img {src} alt="" width="32" height="32">
</button>