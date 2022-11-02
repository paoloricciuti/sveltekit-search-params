<script>
  import BrowserWindow from "./BrowserWindow.svelte";
  import "../assets/fonts.css";
  import { typewriter } from "svelte-typewriter-store";
  const store = typewriter(["pablopang", "rich_harris", "albert_einstein"], 30);
</script>

<svelte:head>
  <title>sveltekit-search-params</title>
</svelte:head>
<h1>sveltekit-search-params</h1>
<div class="wrapper">
  <BrowserWindow title="" url={`https://my.app?username=${$store}`}>
    <div class="content">
      <input readonly value={$store} /> <br />
      Your username is {$store}
    </div>
  </BrowserWindow>
</div>

<style>
  :global(body) {
    overflow: hidden;
    margin: 0;
    background: #222;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  h1 {
    text-align: center;
    max-width: 100vw;
  }
  .wrapper {
    width: 60rem;
    margin: auto;
    padding: 1rem;
  }
  .content {
    background-color: white;
    width: 100%;
    height: 100%;
    padding: 2rem;
    color: black;
  }
</style>
