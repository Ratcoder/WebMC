<script>
    import { fly } from 'svelte/transition';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import EnumInput from '../EnumInput.svelte';
    import IntInput from '../IntInput.svelte';
    import BoolInput from '../BoolInput.svelte';
    import defaultSettings from '../../../app/defaultSettings.js';
    import IconButton from '../IconButton.svelte';
    import PopupButton from '../PopupButton.svelte';
    export let user;
    $: disabled = user?.level < 2;

    const tabs = ['General', 'Game Settings', 'Backups', 'Player Permissions', 'Advanced', 'Admins'];
    let currentTab = 0;
    let mcRestartRequired = {};

    let serverName = "Minecraft Server";

    let settings = {};
    let savedSettings = {};
    let unsavedChanged = false;
    $:{
        unsavedChanged = false;
        for (const key in settings) {
            if (Object.hasOwnProperty.call(settings, key)) {
                if(settings[key] !== savedSettings[key]){
                    unsavedChanged = true;
                    break;
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
                    if(settings[key] == null){
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

    let admins = [];
    function fetchAdmins(){
        fetch('/api/admins')
            .then(data => data.json())
            .then(json => {
                admins = json;
                admins.forEach(el => {
                    if(el.isYou){
                        permissionLevel = el.level;
                    }
                });
            });
    }
    fetchAdmins();

    let permissionLevel = 1;
    let isEditingAdmin = false;
    let editingAdmin = {};
    function editAdmin(id){
        isEditingAdmin = true;
        editingAdmin.id = id;
        editingAdmin.name = admins[id].name;
        editingAdmin.level = admins[id].level;
    }
    function sendEditAdmin(){
        isEditingAdmin = false;
        let body = {
            name: editingAdmin.name
        };
        if(editingAdmin.level != admins[editingAdmin.id].level){
            body.level = editingAdmin.level;
        }
        if(editingAdmin.settingPassword && editingAdmin.password == editingAdmin.confirmPassword) {
            body.password = editingAdmin.password;
        }
        fetch(`/api/changeAdmin`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify(body)})
            .then(response => {
                fetchAdmins();
            });
    }
    let isAddingAdmin = false;
    let addingAdmin = {};
    function addAdmin(){
        isAddingAdmin = false;
        let body = {
            name: addingAdmin.name,
            level: addingAdmin.level
        };
        if(addingAdmin.password == addingAdmin.confirmPassword) {
            body.password = addingAdmin.password;
            fetch(`/api/admins`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/json'}, body: JSON.stringify(body)})
                .then(response => {
                    fetchAdmins();
                });
        }
    }
    function deleteAdmin(name){
        isEditingAdmin = false;
        fetch(`/api/deleteAdmin`, {cache: 'no-cache', method: 'post', headers: {'Content-Type': 'text/plain'}, body: name})
            .then(response => {
                fetchAdmins();
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
            {#if currentTab == 0}
                <TextInput {disabled} bind:value={settings.serverName} name="Server Name">Server Name</TextInput>
                <EnumInput {disabled} bind:value={settings.levelType} options={['FLAT', 'LEGACY', 'DEFAULT']} optionsDisplay={['Flat', 'Old', 'Infinite']} name="World Type"></EnumInput>
                <TextInput {disabled} bind:value={settings.levelSeed} name="Seed">Seed</TextInput>
            {:else if currentTab == 1}
                <EnumInput {disabled} bind:value={settings.defaultGamemode} options={['survival', 'creative', 'adventure']} name="Default Gamemode"></EnumInput>
                <EnumInput {disabled} bind:value={settings.difficulty} options={['peaceful', 'easy', 'normal', 'hard']} name="Difficulty"></EnumInput>
                <EnumInput {disabled} bind:value={settings.defaultPlayerPermissionLevel} options={['visitor', 'member', 'operator']} name="Default Player Permission Level"></EnumInput>
                <IntInput {disabled} bind:value={settings.tickDistance} min=4 max=12 name="Simulation Distance"></IntInput>
                <BoolInput {disabled} bind:value={settings.pvp} name="Friendly Fire"></BoolInput>
                <BoolInput {disabled} bind:value={settings.showCoordinates} name="Show Coordinates"></BoolInput>
                <BoolInput {disabled} bind:value={settings.doFireTick} name="Fire Spreads"></BoolInput>
                <BoolInput {disabled} bind:value={settings.tntExplodes} name="TNT Explodes"></BoolInput>
                <BoolInput {disabled} bind:value={settings.doMobLoot} name="Mob Loot"></BoolInput>
                <BoolInput {disabled} bind:value={settings.naturalRegeneration} name="Natural Regeneration"></BoolInput>
                <BoolInput {disabled} bind:value={settings.doTileDrops} name="Tile Drops"></BoolInput>
                <BoolInput {disabled} bind:value={settings.doImmediateRespawn} name="Immediate Respawn"></BoolInput>
                <IntInput {disabled} bind:value={settings.spawnRadius} name="Respawn Radius"></IntInput>
                <h3>Cheats</h3>
                <BoolInput {disabled} bind:value={settings.cheats} name="Cheats"></BoolInput>
                {#if settings.cheats}
                    <BoolInput {disabled} bind:value={settings.doDaylightCycle} name="Do Daylight Cycle"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.doWeatherCycle} name="Do Weather Cycle"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.keepInventory} name="Keep Inventory"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.doMobSpawning} name="Mob Spawning"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.mobGriefing} name="Mob Griefing"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.doEntityDrops} name="Do Entity Drops"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.weatherCycle} name="Weather Cycle"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.commandBlocksEnabled} name="Command Blocks Enabled"></BoolInput>
                    <IntInput {disabled} bind:value={settings.randomTickSpeed} name="Random Tick Speed"></IntInput>
                    <BoolInput {disabled} bind:value={settings.doInsomnia} name="Insomnia"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.drowningDamage} name="Drowning Damage"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.fallDamage} name="Fall Damage"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.fireDamage} name="Fire Damage"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.showDeathMessages} name="Show Death Messages"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.sendCommandFeedback} name="Send Command Feedback"></BoolInput>
                    <BoolInput {disabled} bind:value={settings.commandBlockOutput} name="Command Block Output"></BoolInput>
                    <IntInput {disabled} bind:value={settings.maxCommandChainLength} name="Max Command Chain Length"></IntInput>
                    <BoolInput {disabled} bind:value={settings.showTags} name="Show Tags"></BoolInput>
                {/if}
            {:else if currentTab == 2}
                <Button {disabled} on:click={backup}>Take Backup</Button>
                <h3>Roll Back</h3>
                {#each backups.sort((a, b) => b - a) as backup}
                    <PopupButton {disabled} on:click={() => {revert(backup)}} popupText="Are you sure you want to restore to this backup? The current world will be overwritten.">{new Date(parseInt(backup)).toLocaleString()}</PopupButton>
                {/each}
            {:else if currentTab == 3}
                <IntInput {disabled} bind:value={settings.maxPlayers} name="Max Players" min=0></IntInput>
                <BoolInput {disabled} bind:value={settings.onlineMode} name="Online Mode"></BoolInput>
                <BoolInput {disabled} bind:value={settings.whitelist} name="White List"></BoolInput>
                <IntInput {disabled} bind:value={settings.playerIdleTimeout} name="Player Idle Timeout" min=0></IntInput>
                <h3>Server Authoritive Movement</h3>
                <BoolInput {disabled} bind:value={settings.serverAuthoritativeMovement} name="Server Authoritive Movement"></BoolInput>
                <IntInput {disabled} bind:value={settings.playerMovementScoreTheshold} name="Player Movement Score Threshold" min=0></IntInput>
                <IntInput {disabled} bind:value={settings.playerMovementDistanceTheshold} name="Player Movement Distance Threshold" min=0></IntInput>
                <IntInput {disabled} bind:value={settings.playerMovementDurationTheshold} name="Player Movement Duration Threshold (in ms)" min=0></IntInput>
                <BoolInput {disabled} bind:value={settings.correctPlayerMovement} name="Correct Player Movement"></BoolInput>
            {:else if currentTab == 4}
                <IntInput {disabled} bind:value={settings.serverPort} name="Port" min=1 max=65535></IntInput>
                <IntInput {disabled} bind:value={settings.serverPortv6} name="IPv6 Port" min=1 max=65535></IntInput>
                <IntInput {disabled} bind:value={settings.compressionThreshold} name="Compression Threshold" min=0 max=65535></IntInput>
                <IntInput {disabled} bind:value={settings.maxViewDistance} name="Max View Distance" min=5></IntInput>
                <IntInput {disabled} bind:value={settings.maxThreads} name="Max Threads" min=0></IntInput>
                <BoolInput {disabled} bind:value={settings.texturepackRequired} name="Texturepack Required"></BoolInput>
                <BoolInput {disabled} bind:value={settings.contentLogFileEnabled} name="Content Log File Enabled"></BoolInput>
            {:else if currentTab == 5}
                {#if isEditingAdmin}
                    <div>
                        <p class='admin-name'>{editingAdmin.name}</p>
                        {#if permissionLevel == 3}
                            <EnumInput bind:value={editingAdmin.level} name="Role" options={[1, 2, 3]} optionsDisplay={['Player Manager', 'Server Manager', 'Owner']}></EnumInput>
                        {/if}
                        {#if editingAdmin.settingPassword}
                            <TextInput name="password" bind:value={editingAdmin.password} password>Set Password</TextInput>
                            <TextInput name="confirm password" bind:value={editingAdmin.confirmPassword} password>Confirm Password</TextInput>
                        {:else}
                            <Button on:click={() => {editingAdmin.settingPassword = true}}>Set New Password</Button>
                        {/if}
                        {#if permissionLevel == 3}
                            <PopupButton on:click={() => {deleteAdmin(editingAdmin.name)}} popupText="Are you sure you would like to delete this admin?">Delete Admin</PopupButton>
                        {/if}
                        <div>
                            <button on:click={sendEditAdmin} style="float: left; width:50%;">Confirm</button>
                            <button on:click={()=>{isEditingAdmin = false}} style="float: right; width:50%;">Cancel</button>
                        </div>
                    </div>
                {:else if isAddingAdmin}
                    <TextInput name="name" bind:value={addingAdmin.name}>Name</TextInput>
                    <EnumInput bind:value={addingAdmin.level} name="Role" options={[1, 2, 3]} optionsDisplay={['Player Manager', 'Server Manager', 'Owner']}></EnumInput>
                    <TextInput name="password" bind:value={addingAdmin.password} password>Password</TextInput>
                    <TextInput name="confirm password" bind:value={addingAdmin.confirmPassword} password>Confirm Password</TextInput>
                    <div>
                        <button on:click={addAdmin} style="float: left; width:50%;">Confirm</button>
                        <button on:click={()=>{isAddingAdmin = false}} style="float: right; width:50%;">Cancel</button>
                    </div>
                {:else}
                    {#each admins as admin, i}
                        <div class='admin'>
                            <div style="float: left; margin-right: 20px">
                                <p class='admin-name'>{admin.name}</p>
                                <p class='admin-level'>
                                    {#if admin.level == 1}
                                        Player Manager
                                    {:else if admin.level == 2}
                                        Server Manager
                                    {:else if admin.level == 3}
                                        Owner
                                    {/if}
                                </p>
                            </div>
                            {#if permissionLevel === 3 || admin.isYou}
                                <IconButton style="float: right; margin-top: 10px;" src="/icons/edit.svg" on:click={() => {editAdmin(i)}}></IconButton>
                            {/if}
                        </div>
                    {/each}
                    <br>
                    {#if permissionLevel == 3}
                        <Button on:click={() => isAddingAdmin = true}>Add New Admin</Button>
                    {/if}
                {/if}
            {/if}
            {#if unsavedChanged && !disabled}
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
    .admin{
        text-align: left;
    }
    .admin::after{
        content:"";
        clear: both;
        display: block;
    }
    .admin-name{
        font-size: 20px;
        font-weight: bold;
    }
    p{
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
    }
</style>