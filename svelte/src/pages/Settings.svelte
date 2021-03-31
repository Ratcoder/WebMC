<script>
    import { fly } from 'svelte/transition';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import EnumInput from '../EnumInput.svelte';
    import IntInput from '../IntInput.svelte';
    import BoolInput from '../BoolInput.svelte';
    import defaultSettings from '../../../app/defaultSettings.js';

    const tabs = ['General', 'Game Settings', 'Backups', 'Player Permissions', 'Advanced'];
    let currentTab = 0;
    let mcRestartRequired = {};

    let serverName = "Minecraft Server";

    let settings = {};
    let savedSettings = {};
    let unsavedChanged = false;
    $:{
        for (const key in settings) {
            if (Object.hasOwnProperty.call(settings, key)) {
                if(settings[key] !== savedSettings[key]){
                    unsavedChanged = true;
                }
            }
        }
    }

    fetch('/api/settings')
        .then(data => data.json())
        .then(json => {
            json.forEach(element => {
                settings[element.key] = element.value;
                savedSettings[element.key] = element.value;
            });
            for (const key in defaultSettings) {
                if (Object.hasOwnProperty.call(defaultSettings, key)) {
                    if(!settings[key]){
                        settings[key] = defaultSettings[key];
                        savedSettings[key] = defaultSettings[key];
                    }
                }
            }
        });
    
    function saveSettings(){
        let body = [];
        for (const key in settings) {
            if (Object.hasOwnProperty.call(settings, key)) {
                const element = settings[key];
                body.push([key, element]);
            }
        }
        fetch(`/api/settings`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify(body)})
            .then(response => {
                for (const key in settings) {
                    if (Object.hasOwnProperty.call(settings, key)) {
                        savedSettings[key] = settings[key];
                        unsavedChanged = false;
                    }
                }
            });
    }

    let backups = [];
    fetch('/api/backups')
        .then(data => data.json())
        .then(json => {
            backups = json;
        });

    function backup(){
        fetch(`/api/backup`, {cache: 'no-cache', method: 'post'})
            .then(response => {

            });
    }
    function revert(path){
        fetch(`/api/revert`, {cache: 'no-cache', method: 'post', body: path})
            .then(response => {

            });
    }
</script>

<div class="main" in:fly="{{ x: 200, duration: 600 }}" out:fly="{{ x: -200, duration: 600 }}">
    {#if settings}
        <div class="tabs">
            {#each tabs as tab, i}
                <button class:selected={i == currentTab} on:click="{()=>{currentTab = i}}">{tab}</button>
            {/each}
        </div>
        <div class="settings">
            <h2>{tabs[currentTab]}</h2>
            {#if mcRestartRequired[tabs[currentTab].prefix]}
                <button on:click={() => {fetch(`/api/restart-mc`, {method: 'post'});}}>Restart To Apply Changes</button>
            {/if}
            {#if currentTab == 0}
                <TextInput bind:value={settings.serverName} name="Server Name">Server Name</TextInput>
            {:else if currentTab == 1}
                <EnumInput bind:value={settings.defaultGamemode} options={['survival', 'creative', 'adventure']} name="Default Gamemode"></EnumInput>
                <EnumInput bind:value={settings.difficulty} options={['peaceful', 'easy', 'normal', 'hard']} name="Difficulty"></EnumInput>
                <EnumInput bind:value={settings.defaultPlayerPermissionLevel} options={['visitor', 'member', 'operator']} name="Default Player Permission Level"></EnumInput>
                <IntInput bind:value={settings.simulationDistance} min=4 max=12 name="Simulation Distance"></IntInput>
                <BoolInput bind:value={settings.pvp} name="Friendly Fire"></BoolInput>
                <BoolInput bind:value={settings.showCoordinates} name="Show Coordinates"></BoolInput>
                <BoolInput bind:value={settings.doFireTick} name="Fire Spreads"></BoolInput>
                <BoolInput bind:value={settings.tntExplodes} name="TNT Explodes"></BoolInput>
                <BoolInput bind:value={settings.doMobLoot} name="Mob Loot"></BoolInput>
                <BoolInput bind:value={settings.naturalRegeneration} name="Natural Regeneration"></BoolInput>
                <BoolInput bind:value={settings.doTileDrops} name="Tile Drops"></BoolInput>
                <BoolInput bind:value={settings.doImmediateRespawn} name="Immediate Respawn"></BoolInput>
                <IntInput bind:value={settings.spawnRadius} name="Respawn Radius"></IntInput>
                <h3>Cheats</h3>
                <BoolInput bind:value={settings.cheats} name="Cheats"></BoolInput>
                <BoolInput bind:value={settings.doDaylightCycle} name="Do Daylight Cycle"></BoolInput>
                <BoolInput bind:value={settings.doWeatherCycle} name="Do Weather Cycle"></BoolInput>
                <BoolInput bind:value={settings.keepInventory} name="Keep Inventory"></BoolInput>
                <BoolInput bind:value={settings.doMobSpawning} name="Mob Spawning"></BoolInput>
                <BoolInput bind:value={settings.mobGriefing} name="Mob Griefing"></BoolInput>
                <BoolInput bind:value={settings.doEntityDrops} name="Do Entity Drops"></BoolInput>
                <BoolInput bind:value={settings.weatherCycle} name="Weather Cycle"></BoolInput>
                <BoolInput bind:value={settings.commandBlocksEnabled} name="Command Blocks Enabled"></BoolInput>
                <IntInput bind:value={settings.randomTickSpeed} name="Random Tick Speed"></IntInput>
                <BoolInput bind:value={settings.doInsomnia} name="Insomnia"></BoolInput>
                <BoolInput bind:value={settings.drowningDamage} name="Drowning Damage"></BoolInput>
                <BoolInput bind:value={settings.fallDamage} name="Fall Damage"></BoolInput>
                <BoolInput bind:value={settings.fireDamage} name="Fire Damage"></BoolInput>
                <BoolInput bind:value={settings.showDeathMessages} name="Show Death Messages"></BoolInput>
                <BoolInput bind:value={settings.sendCommandFeedback} name="Send Command Feedback"></BoolInput>
                <BoolInput bind:value={settings.commandBlockOutput} name="Command Block Output"></BoolInput>
                <IntInput bind:value={settings.maxCommandChainLength} name="Max Command Chain Length"></IntInput>
                <BoolInput bind:value={settings.showTags} name="Show Tags"></BoolInput>
            {:else if currentTab == 2}
                <Button on:click={backup}>Take Backup</Button>
                <h3>Roll Back</h3>
                {#each backups as backup}
                    <Button on:click={() => {revert(backup)}}>{new Date(parseInt(backup)).toLocaleString()}</Button>
                {/each}
            {:else if currentTab == 3}
                <IntInput bind:value={settings.maxPlayers} name="Max Players" min=0></IntInput>
                <BoolInput bind:value={settings.onlineMode} name="Online Mode"></BoolInput>
                <BoolInput bind:value={settings.whitelist} name="White List"></BoolInput>
                <IntInput bind:value={settings.playerIdleTimeout} name="Player Idle Timeout" min=0></IntInput>
                <h3>Server Authoritive Movement</h3>
                <BoolInput bind:value={settings.serverAuthoritativeMovement} name="Server Authoritive Movement"></BoolInput>
                <IntInput bind:value={settings.playerMovementScoreTheshold} name="Player Movement Score Threshold" min=0></IntInput>
                <IntInput bind:value={settings.playerMovementDistanceTheshold} name="Player Movement Distance Threshold" min=0></IntInput>
                <IntInput bind:value={settings.playerMovementDurationTheshold} name="Player Movement Duration Threshold (in ms)" min=0></IntInput>
                <BoolInput bind:value={settings.correctPlayerMovement} name="Correct Player Movement"></BoolInput>
            {:else if currentTab == 4}
                <IntInput bind:value={settings.serverPort} name="Port" min=1 max=65535></IntInput>
                <IntInput bind:value={settings.serverPortv6} name="IPv6 Port" min=1 max=65535></IntInput>
                <IntInput bind:value={settings.compressionThreshold} name="Compression Threshold" min=0 max=65535></IntInput>
                <IntInput bind:value={settings.maxViewDistance} name="Max View Distance" min=5></IntInput>
                <IntInput bind:value={settings.maxThreads} name="Max Threads" min=0></IntInput>
                <BoolInput bind:value={settings.texturepackRequired} name="Texturepack Required"></BoolInput>
                <BoolInput bind:value={settings.contentLogFileEnabled} name="Content Log File Enabled"></BoolInput>
            {/if}
            {#if unsavedChanged}
                <Button on:click={saveSettings}>Save Settings</Button>
            {/if}
        </div>
    {/if}
</div>

<style>
    div.main{
		/* display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap; */
        position: absolute;
        width: 100%;
	}
    .tabs{
        margin-top: 20px;
        float: left;
        transform: translateX(calc(50vw - 170%));
    }
    h2{
        text-align: left;
        color: rgba(255,255,255,0.87);
        display:block;
        width: 100%;
    }
    .settings{
        position: absolute;
        left: calc(50vw - 100px);
    }
    @media only screen and (max-width: 700px) {
        .tabs{
            /* float: none; */
            /* position: absolute;
            left: calc(50vw - 50%); */
            float:none;
            transform: translateX(calc(50vw - 100px));
        }
        .settings{
            position: unset;
            transform: translateX(calc(50vw - 100px));
        }
    }
    button{
        appearance: none;
        -webkit-appearance: none;
        -webkit-border-radius: 0;
        display: block;
        background-color: #1e1e1e;
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20);
        border: none;
        border-radius: 0;
        margin: auto;
        margin: 0px;
        height: 40px;
        width: 200px;

        color: rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        transition: all 300ms;
    }
    button.selected{
        text-decoration: underline;
    }
    button:hover{
        background-color: #222222;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20);
    }
    button:focus{
        border: none;
        outline: none;
    }
    h3{
        text-align: left;
        color: rgba(255,255,255,0.87);
    }
</style>