const API_URL = '/api/results';

// Helper to determine leading party based on seat counts
function getLeadingParty(leading) {
  const parties = Object.keys(leading);
  let max = -Infinity;
  let leader = '';
  parties.forEach(p => {
    if (leading[p] > max) {
      max = leading[p];
      leader = p;
    }
  });
  return { party: leader, seats: max };
}

async function fetchData() {
  try {
    const response = await fetch(`${API_URL}?state=kerala`);
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Keep previous UI state on error
  }
}

function updateUI(data) {
  // Hero section – total seats and last updated
  document.getElementById('total-seats').textContent = data.totalSeats;
  document.getElementById('last-updated').textContent = new Date(data.lastUpdated).toLocaleString();

  // Leading party highlight
  const { party, seats } = getLeadingParty(data.leading);
  const leadingSection = document.getElementById('leading-party-section');
  document.getElementById('leading-party-name').textContent = party === '' ? 'N/A' : party;
  document.getElementById('leading-party-seats').textContent = `${seats} seats`;

  // Apply color border based on leading party
  const colorMap = {
    LDF: '#e74c3c',
    UDF: '#27ae60',
    BJP: '#ff9900',
    Others: '#95a5a6'
  };
  leadingSection.style.borderLeftColor = colorMap[party] || '#34495e';

  // Party grid cards
  const partyGrid = document.getElementById('party-grid');
  partyGrid.innerHTML = '';
  const parties = ['LDF', 'UDF', 'BJP', 'Others'];
  parties.forEach(p => {
    const card = document.createElement('div');
    card.className = `party-card ${p.toLowerCase()}`;
    if (p === party) card.classList.add('leading');
    card.innerHTML = `
      <div class="party-name">${p}</div>
      <div class="party-count ${p.toLowerCase()}">${data.leading[p]}</div>
    `;
    partyGrid.appendChild(card);
  });

  // Constituencies list with close contest badge
  const list = document.getElementById('constituencies-list');
  list.innerHTML = '';

  // If no constituencies yet (counting hasn't started), show countdown message
  if (!data.constituencies || data.constituencies.length === 0) {
    const countdown = document.createElement('div');
    countdown.className = 'countdown-message';
    countdown.textContent = 'Vote counting starts in 1 day';
    list.appendChild(countdown);
    return; // skip rendering constituencies
  }

  data.constituencies.forEach(cons => {
    const item = document.createElement('div');
    const isClose = Math.abs(cons.margin) < 1000;
    item.className = `constituency-item ${isClose ? 'close-contest' : ''}`;
    const marginClass = cons.margin >= 0 ? 'margin-positive' : 'margin-negative';
    const badge = isClose ? '<span class="close-contest-badge">Close</span>' : '';
    item.innerHTML = `
      <div class="constituency-info">
        <div class="constituency-name">${cons.name}</div>
        <div class="constituency-details">
          ${cons.leadingParty} ${cons.status}${badge}
        </div>
      </div>
      <div class="constituency-margin ${marginClass}">
        ${cons.margin >= 0 ? '+' : ''}${cons.margin}
      </div>
    `;
    list.appendChild(item);
  });
}

// Initial fetch and automatic refresh every 5 seconds
fetchData();
setInterval(fetchData, 5000);