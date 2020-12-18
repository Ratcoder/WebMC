<script>
    import IconButton from './IconButton.svelte';
    import { fade } from 'svelte/transition';

    export let player;
    export let changePermission;
    export let ban;
    export let pardon;

    let open = false;
</script>


<div transition:fade={{duration:600}} class:big={!ban}>
    <button on:click={() => {open = !open}}>{player.name}</button>
    <IconButton title="Operator" src="/icons/crown.svg" on:click={changePermission('operator')} disabled={player.permission=='operator'}></IconButton>
    <IconButton title="Member" src="/icons/star.svg" on:click={changePermission('member')} disabled={player.permission=='member'}></IconButton>
    <IconButton title="Visitor" src="/icons/hand.svg" on:click={changePermission('visitor')} disabled={player.permission=='visitor'}></IconButton>
    {#if ban}
        <IconButton title="Ban" src="/icons/user-x.svg" on:click={ban(100, 'Just because.')}></IconButton>
    {:else}
        <IconButton title="Pardon" src="/icons/user-check.svg" on:click={pardon()}></IconButton>
        <br>
        <p>Banned until: {player.ban.until}</p>
        <p>Reason: {player.ban.reason}</p>
    {/if}
    
</div>

<style>
	button{
        cursor: pointer;
        background-color: transparent;
		height: 20px;
		border: none;
		padding: 0;
		font: inherit;
		-webkit-appearance: none;

		color: rgba(255,255,255,0.6);
        margin: 2px;
        display: block;
        width: 100%;
        height: 32px;
	}
    div:hover{
		background-color: #222222;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
	}
	button:focus,button:active{
		border: none;
		outline: none;
        box-shadow: none;
        background-color: transparent;
    }
    div{
        height: 32px;
        overflow: hidden;
        transition: all 0.3s;
        position: relative;
    }
    div:focus-within{
        height: 90px;
        background-color: #222222;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    div.big:focus-within{
        height: 130px;
    }
    div:focus-within button{
        color: rgba(255,255,255,0.87);
    }
    p{
        margin: 0px;
        color: rgba(255,255,255,0.6);
    }
    @supports (-webkit-touch-callout: none) {
        /* CSS specific to iOS devices */ 
        div:hover{
            height: 90px;
            background-color: #222222;
		    box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
        }
        div:hover button{
            color: rgba(255,255,255,0.87);
        }
        div.big:hover{
            height: 130px;
        }
    }
</style>