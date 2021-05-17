<script>
    import IconButton from './IconButton.svelte';
    import Button from './Button.svelte';
    import { fade } from 'svelte/transition';

    export let player;
    export let changePermission;
    export let ban;
    export let pardon;

    let open = false;
    let isBanning = false;
    let banReason;
    let banDurationNumber = 1;
    let banDurationUnit = 0;

    let container;
    window.addEventListener('click', function(e){   
        if (!container.contains(e.target)){
            isBanning = false;
        }
    });

    function banPlayer(){
        isBanning = false;
        let until = Date.now();
        console.log(banDurationUnit)
        if(banDurationUnit == 0){
            until += 3600000 * banDurationNumber;
        }
        else if(banDurationUnit == 1){
            until += 86400000 * banDurationNumber;
        }
        else if(banDurationUnit == 2){
            until += 604800000 * banDurationNumber;
        }
        else{
            until = 2147483647;
        }
        ban(until, banReason.innerText);
    }
</script>

<div transition:fade={{duration:600}} class:big={!ban} id="player" bind:this={container}>
    <button class:online={player.isOnline} on:click={() => {open = !open}}>{player.name}</button>
    <IconButton title="Operator" src="/icons/crown.svg" on:click={changePermission('operator')} disabled={player.permission=='operator'}></IconButton>
    <IconButton title="Member" src="/icons/star.svg" on:click={changePermission('member')} disabled={player.permission=='member'}></IconButton>
    <IconButton title="Visitor" src="/icons/hand.svg" on:click={changePermission('visitor')} disabled={player.permission=='visitor'}></IconButton>
    {#if ban}
        <IconButton title="Ban" src="/icons/user-x.svg" on:click={() => {isBanning = true}}></IconButton>
    {:else}
        <IconButton title="Pardon" src="/icons/user-check.svg" on:click={pardon()}></IconButton>
        <br>
        <p>Banned until: {new Date(player.ban.until).toLocaleString()}</p>
        <p>Reason: {player.ban.reason}</p>
    {/if}

    {#if isBanning}
        <div class=popup>
            <h3>Ban {player.name}</h3>
            <label for="reason">Reason</label>
            <span id="reason" role="textbox" contenteditable bind:this={banReason}></span>
            <label for="durationNumber">Duration</label>
            <div style="display: flex; gap: 10px">
                <input type="number" id="durationNumber" style="width: 70%;" bind:value={banDurationNumber}>
                <select name="" id="" style="width: 30%" bind:value={banDurationUnit}>
                    <option value=0>Hours</option>
                    <option value=1>Days</option>
                    <option value=2>Weeks</option>
                    <option value=3>Forever</option>
                </select>
            </div>
            <div style="display: flex; gap: 10px">
                <button on:click={banPlayer}>Ban</button>
                <button on:click={() => isBanning = false}>Cancel</button>
            </div>
        </div>
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

		color: rgba(255,255,255,0.38);
        margin: 2px;
        display: block;
        width: 100%;
        height: 32px;
	}
    button.online{
        color: rgba(255,255,255,0.6);
    }
    #player:hover{
		background-color: #222222;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
	}
	button:focus,button:active{
		border: none;
		outline: none;
        box-shadow: none;
        background-color: transparent;
    }
    #player{
        height: 32px;
        overflow: hidden;
        transition: all 0.3s;
        position: relative;
    }
    #player:focus-within{
        height: 90px;
        background-color: #222222;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    #player.big:focus-within{
        height: 130px;
    }
    #player:focus-within button{
        color: rgba(255,255,255,0.87);
    }
    p{
        margin: 0px;
        color: rgba(255,255,255,0.6);
    }
    @supports (-webkit-touch-callout: none) {
        /* CSS specific to iOS devices */ 
        #player:hover{
            height: 90px;
            background-color: #222222;
		    box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
        }
        #player:hover button{
            color: rgba(255,255,255,0.87);
        }
        #player.big:hover{
            height: 130px;
        }
    }
    .popup{
        position: fixed;
        margin: 0;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%, -50%);
        background-color: #252525;
        box-shadow: 0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20);
        width: 250px;
        /* height: 250px; */
        padding: 10px;
        z-index: 1000;
    }
    h3{
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        margin-top: 0px;
        margin-bottom: 10px;
    }
    .popup button, label, input, span{
        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        text-align: left;
    }
    .popup button, input, select, span{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: none;
        background-color: #272727;
        color: rgba(255,255,255,0.6);
        box-shadow: 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20);
        border: none;
        border-radius: 0;
        transition: all 300ms;
        min-height: 30px;
        padding: 2px;
        margin-bottom: 10px;
    }
    .popup button:hover, input:hover, select:hover, span:hover{
        background-color: #2c2c2c;
        box-shadow: 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20);
    }
    .popup button:focus, input:focus, select:focus, span:focus{
        border: none;
        outline: none;
    }
    .popup button{
        text-align: center;
    }
</style>