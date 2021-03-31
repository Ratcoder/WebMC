<script>
    import Player from '../Player.svelte';
    import { onDestroy } from 'svelte';
    import { fade, fly } from 'svelte/transition';


    let players = [];
    let operators = [];
    let members = [];
    let visitors = [];
    let banned = [];
    let loaded = false;

    $:{
        operators = [];
        members = [];
        visitors = [];
        banned = [];
        players.forEach(element => {
                if(element.ban){
                    banned.push(element);
                }
                else if(element.permission == 'operator'){
                    operators.push(element);
                }
                else if(element.permission == 'member'){
                    members.push(element);
                }
                else if(element.permission == 'visitor'){
                    visitors.push(element);
                }
            });
            loaded = true;
    }

    let source = new EventSource(`/api/player-managment/players`);
    source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        let playerExists = false;
        players.forEach((element, i) => {
            if(element.name == data.name){
                players[i] = data;
                players = players;
                playerExists = true;
            }
        });
        if(!playerExists){
            players.push(data);
            players = players;
        }
    }

    import { quintOut } from 'svelte/easing';
    import { crossfade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { element } from 'svelte/internal';
    const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
    });
    
    function changePermission(player, per){
        fetch(`/api/player-managment/permission`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify({xuid: player.xuid, permission: per, until: 100})})
            .then(response => {
                players.forEach(element => {
                    if(element.name == player.name){
                        element.permission = per;
                    }
                });
                players = players;
            });
    }
    function ban(player, until, reason){
        fetch(`/api/player-managment/ban`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify({xuid: player.xuid, reason, until})})
            .then(response => {
                players.forEach(element => {
                    if(element.name == player.name){
                        element.ban = {reason, until};
                    }
                });
                players = players;
            });
    }
    function pardon(player){
        fetch(`/api/player-managment/pardon`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify({xuid: player.xuid})})
            .then(response => {
                players.forEach(element => {
                    if(element.name == player.name){
                        element.ban = false;
                    }
                });
                players = players;
            });
    }
</script>

{#if loaded}
    <div class="page" in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
        <div class="card">
            <h2>Operators</h2>
            {#each operators as player (player.name)}
                <div in:receive="{{key: player.name }}" out:send="{{key: player.name}}" animate:flip="{{duration:600 }}">
                    <Player {player} changePermission={(per)=>{changePermission(player, per);}} ban={(until, reason) => {ban(player, until, reason)}}></Player>
                </div>
            {/each}
        </div>
    
        <div class="card">
            <h2>Members</h2>
            {#each members as player (player.name)}
                <div in:receive="{{key: player.name }}" out:send="{{key: player.name}}" animate:flip="{{duration:600 }}">
                    <Player {player} changePermission={(per)=>{changePermission(player, per)}} ban={(until, reason) => {ban(player, until, reason)}}></Player>
                </div>
            {/each}
        </div>
    
        <div class="card">
            <h2>Visitors</h2>
            {#each visitors as player (player.name)}
                <div in:receive="{{key: player.name }}" out:send="{{key: player.name}}" animate:flip="{{duration:600 }}">
                    <Player {player} changePermission={(per)=>{changePermission(player, per)}} ban={(until, reason) => {ban(player, until, reason)}}></Player>
                </div>
            {/each}
        </div>

        <div class="card">
            <h2>Banned</h2>
            {#each banned as player (player.name)}
                <div in:receive="{{key: player.name}}" out:send="{{key: player.name}}" animate:flip="{{duration: 600}}">
                    <Player {player} changePermission={(per)=>{changePermission(player, per)}} pardon={() => {pardon(player)}}></Player>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    h2 {
		color: rgba(255,255,255,0.87);
        margin: 0;
        margin-bottom: 10px;
	}
    div.card{
        padding: 20px;
        padding-top: 10px;
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        width: 310px;
        margin: 10px;
    }
    .page{
        display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap;
        position: absolute;
        width: 100%;
    }
</style>
