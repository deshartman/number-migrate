<script>
  import axios from "axios";

  let accountSid = "";
  let authToken = "";
  let trunkSid = "";
  let phoneSid = "";
  let voiceUrl = "";
  let batchSize = 100;

  $: sipApi = `https://trunking.twilio.com/v1/Trunks/${trunkSid}`;
  $: voiceApi = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;

  // SIP Trunk Array used for fallback
  // @ts-ignore
  let sipTrunkArray = [];
  // Prog Voice Array for converted phone numbers
  // @ts-ignore
  let voiceArray = [];

  //Visual components
  let counter = 0;
  let total = 0;
  let getNumbersDisabled = false;
  let updateUrlDisabled = true;
  let moveBatchDisabled = true;
  let restoreBatchDisabled = true;
  let resultError = "None";

  // Axios Config
  $: axiosConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    },
  };

  // Get an Array of numbers for the Trunk SID
  const getNumbers = async () => {
    getNumbersDisabled = true;
    try {
      // console.log(`Creds: ${accountSid}:${authToken}  Basic ${btoa(`${accountSid}:${authToken}`)}`);
      const response = await axios.get(`${sipApi}/PhoneNumbers?PageSize=${batchSize}`, axiosConfig);

      sipTrunkArray = response.data.phone_numbers;
      // console.log(`Got ${JSON.stringify(sipTrunkArray, null, 4)} entries`);
      console.log(`batch sipTrunkArray: ${sipTrunkArray.length}`);

      getNumbersDisabled = false;
      updateUrlDisabled = false;
      moveBatchDisabled = true;
      restoreBatchDisabled = true;
    } catch (error) {
      getNumbersDisabled = false;
      console.log(`getNumbers error: ${error}`);
      resultError = `getNumbers error: ${error}`;
    }
  };

  // Add Voice URL to a Phone Number
  const addVoiceUrl = async () => {
    updateUrlDisabled = true;
    total = sipTrunkArray.length; // visual update of total
    const params = new URLSearchParams();
    params.append("VoiceUrl", voiceUrl);

    // update the voice_url for all numbers in the sipTrunkArray
    for (let i = 0; i < sipTrunkArray.length; i++) {
      counter = i + 1; // visual update of counter
      try {
        // console.log(`counter: ${i}. phoneSid: ${sipTrunkArray[i].sid}, voiceURL: ${voiceUrl}`);

        const response = await axios.post(
          `${voiceApi}/IncomingPhoneNumbers/${sipTrunkArray[i].sid}.json`,
          params,
          axiosConfig
        );

        // update the local sipTrunkArray with the new voiceUrl
        sipTrunkArray[i].voice_url = voiceUrl;
        console.log(`addVoiceUrl updated ${sipTrunkArray[i].sid} with voice URL: ${voiceUrl}`);
      } catch (error) {
        updateUrlDisabled = false;
        console.log(`Error updating voiceArray: ${sipTrunkArray} with error: ${error}`);
        resultError = `Error updating voiceArray: ${sipTrunkArray} with error: ${error}`;
        return;
      }
    }
    // Change the buttons
    getNumbersDisabled = true;
    moveBatchDisabled = false;
    restoreBatchDisabled = true;
  };

  // Move a batch of numbers from SIP Trunk to Prog Voice, storing Phone & Trunk SID in backup Array
  const moveBatch = async () => {
    moveBatchDisabled = true;

    // If sipTrunkArray length is less than batch size, set batch size to sipTrunkArray length
    if (sipTrunkArray.length < batchSize) {
      batchSize = sipTrunkArray.length;
      console.log(`loopSize less than batchSize: ${batchSize}`);
    }

    // Create a new array with details from sipTrunkArray
    let totalEntries = batchSize;
    total = batchSize; // visual update of total

    try {
      // have to use loop because of async
      for (let i = 0; i < totalEntries; i++) {
        console.log(`loop counter: ${i}`);
        counter = i + 1; // visual update of counter

        const response = await axios.delete(`${sipApi}/PhoneNumbers/${sipTrunkArray[0].sid}`, axiosConfig);
        console.log(`moveBatch deleted phone SID: ${sipTrunkArray[0].sid} for trunk SID: ${trunkSid}`);

        // Now remove the number from the sipTrunkArray and move to the voiceArray
        voiceArray.push(sipTrunkArray[0]);
        // Remove the current entry from sipTrunkArray
        sipTrunkArray.splice(0, 1);
      }

      voiceArray = voiceArray; // Trigger reactivity
      sipTrunkArray = sipTrunkArray; // Trigger reactivity

      // If complete, disable the moveBatch button
      getNumbersDisabled = true;
      updateUrlDisabled = true;
      restoreBatchDisabled = false;
    } catch (error) {
      moveBatchDisabled = false;
      console.log(`moveBatch error: ${error}`);
      resultError = `moveBatch error: ${error}`;
    }
  };

  // Restore the SIP Trunks based on the voiceArray backup
  const restoreSipTrunk = async () => {
    restoreBatchDisabled = true;

    total = voiceArray.length;
    let totalEntries = voiceArray.length;

    try {
      for (let i = 0; i < totalEntries; i++) {
        counter = i + 1; // visual update of counter

        const params = new URLSearchParams();
        params.append("PhoneNumberSid", voiceArray[0].sid);

        const response = await axios.post(`${sipApi}/PhoneNumbers`, params, axiosConfig);
        console.log(`restoreSipTrunk phoneNumberSid ${voiceArray[0].sid}`);

        // Now remove the number from the voiceArray and move to the sipArray
        sipTrunkArray.push(voiceArray[0]);
        // Remove the current entry from voiceArray
        voiceArray.splice(0, 1);
      }

      getNumbersDisabled = false;
      updateUrlDisabled = true;
      moveBatchDisabled = true;

      voiceArray = voiceArray; // Trigger reactivity
      sipTrunkArray = sipTrunkArray; // Trigger reactivity
    } catch (error) {
      restoreBatchDisabled = false;
      console.log(`Error updating Phone SID: ${voiceArray[0].sid} with error: ${error}`);
      resultError = `Error updating Phone SID: ${voiceArray[0].sid} with error: ${error}`;
    }
  };
</script>

<main>
  <input type="text" placeholder="Account SID" bind:value={accountSid} />
  <input type="password" placeholder="Auth Token" bind:value={authToken} />
  <input type="text" placeholder="Trunk SID" bind:value={trunkSid} />
  <input type="text" placeholder="Voice URL https://somevalue.com/function" bind:value={voiceUrl} />
  <input type="number" placeholder="Batch Size" bind:value={batchSize} />

  <button disabled={getNumbersDisabled} on:click={getNumbers}>Get Numbers</button>
  <button disabled={updateUrlDisabled} on:click={addVoiceUrl}>Add URL</button>
  <button disabled={moveBatchDisabled} on:click={moveBatch}>Move Batch</button>
  <button disabled={restoreBatchDisabled} on:click={restoreSipTrunk}>Restore Batch</button>
  <span>Progress: {counter}/{total}</span>
  <h4>Error Message:</h4>
  <p>{resultError}</p>

  <div class="columns">
    <div class="arrayList">
      <h2>SIP Trunk Numbers</h2>
      <ul>
        {#each sipTrunkArray as { friendly_name, phone_number, sid, trunk_sid, voice_url }}
          <li>
            <h3>{friendly_name} ({phone_number})</h3>
            <div>
              <div>Phone SID: {sid}</div>
              <div>Trunk SID: {trunk_sid}</div>
              <div>Voice URL: {voice_url}</div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
    <div class="arrayList">
      <h2>Prog Voice Numbers</h2>
      <ul>
        {#each voiceArray as { friendly_name, phone_number, sid }}
          <li>
            <h3>{friendly_name} ({phone_number})</h3>
            <div>
              <div>Phone SID: {sid}</div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</main>

<style>
  .columns {
    display: flex;
    flex-direction: row;
    align-items: top;
  }
  .arrayList {
    width: 900px;
  }

  ul {
    border-style: solid;
    /* list-style-type: circle; */
    padding: 0;
  }

  input {
    display: block;
    width: 400px;
    margin: 5px;
  }
</style>
