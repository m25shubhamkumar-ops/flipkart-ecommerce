/**
 * Flipkart India Address Assistant
 * - All 36 Indian States & Union Territories
 * - Curated district and city data for every state
 * - Live India Post Postal PIN code verification (api.postalpincode.in)
 * - Interactive City <datalist> selection + manual writing option
 * - One-click quick city selection pills
 */

const INDIA_STATES_DATA = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kadapa", "Kakinada", "Anantapur", "Vizianagaram", "Eluru", "Ongole"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Aalo", "Roing"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Danapur", "Bettiah", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Nawada", "Buxar", "Kishanganj", "Sitamarhi"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Durg", "Jagdalpur", "Ambikapur", "Raigarh"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Valsad", "Vapi"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Rewari"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Manali", "Baddi", "Nahan", "Una", "Hamirpur", "Bilaspur", "Chamba"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Hosapete", "Gadag-Betageri", "Udupi", "Hassan", "Bhadravati", "Chitradurga", "Kolar", "Mandya", "Chikkamagaluru"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Manjeri", "Thalassery", "Ponnani", "Malappuram", "Kasaragod"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Katni", "Singrauli", "Burhanpur", "Khandwa", "Morena", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Damoh", "Mandsaur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad (Chhatrapati Sambhajinagar)", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded", "Kolhapur", "Akola", "Panvel", "Ulhasnagar", "Sangli", "Malegaon", "Jalgaon", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Jalna", "Satara"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati"],
  "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar", "Cherrapunji"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali (SAS Nagar)", "Hoshiarpur", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Firozpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", "Kishangarh", "Baran", "Hanumangarh", "Beawar", "Dholpur"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Singtam"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam (Ooty)", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Siddipet"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai", "Ambassa"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj (Allahabad)", "Ghaziabad", "Noida", "Greater Noida", "Meerut", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Faizabad (Ayodhya)", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda", "Pilibhit"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Pithoragarh", "Almora", "Mussoorie"],
  "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Darjeeling"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar"],
  "Chandigarh": ["Chandigarh", "Manimajra"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Amli"],
  "Delhi": ["New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi", "Shahdara", "Dwarka", "Rohini", "Connaught Place", "Saket", "Karol Bagh", "Lajpat Nagar", "Janakpuri", "Vasant Kunj"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Sopore", "Ganderbal", "Pulwama", "Kupwara"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

const PINCODE_PREFIX_MAP = [
  { prefix: [11], state: "Delhi" },
  { prefix: [12, 13], state: "Haryana" },
  { prefix: [14, 15, 16], state: "Punjab" },
  { prefix: [16], state: "Chandigarh" },
  { prefix: [17], state: "Himachal Pradesh" },
  { prefix: [18, 19], state: "Jammu and Kashmir" },
  { prefix: [20, 21, 22, 23, 24, 25, 26, 27, 28], state: "Uttar Pradesh" },
  { prefix: [24, 26], state: "Uttarakhand" },
  { prefix: [30, 31, 32, 33, 34], state: "Rajasthan" },
  { prefix: [36, 37, 38, 39], state: "Gujarat" },
  { prefix: [40, 41, 42, 43, 44], state: "Maharashtra" },
  { prefix: [403], state: "Goa" },
  { prefix: [45, 46, 47, 48], state: "Madhya Pradesh" },
  { prefix: [49], state: "Chhattisgarh" },
  { prefix: [50, 51, 52, 53], state: "Andhra Pradesh" },
  { prefix: [50, 51], state: "Telangana" },
  { prefix: [56, 57, 58, 59], state: "Karnataka" },
  { prefix: [60, 61, 62, 63, 64], state: "Tamil Nadu" },
  { prefix: [67, 68, 69], state: "Kerala" },
  { prefix: [70, 71, 72, 73, 74], state: "West Bengal" },
  { prefix: [75, 76, 77], state: "Odisha" },
  { prefix: [78], state: "Assam" },
  { prefix: [79], state: "Tripura" },
  { prefix: [80, 81, 82, 83, 84, 85], state: "Bihar" },
  { prefix: [81, 82, 83], state: "Jharkhand" }
];

function initIndianAddressForm(container, options = {}) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) return;

  const stateSelect = root.querySelector('select[name="state"]') || root.querySelector('.state-select');
  const cityInput = root.querySelector('input[name="city"]') || root.querySelector('.city-input');
  const pincodeInput = root.querySelector('input[name="pincode"]') || root.querySelector('.pincode-input');
  const statusBadge = root.querySelector('.pincode-status') || null;
  const quickCitiesContainer = root.querySelector('.quick-cities') || null;

  if (!stateSelect || !cityInput || !pincodeInput) return;

  let datalistId = cityInput.getAttribute('list');
  if (!datalistId) {
    datalistId = 'datalist_' + Math.random().toString(36).substring(2, 9);
    cityInput.setAttribute('list', datalistId);
  }
  let datalist = document.getElementById(datalistId);
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = datalistId;
    cityInput.parentNode.appendChild(datalist);
  }

  if (stateSelect.options.length <= 1) {
    stateSelect.innerHTML = '<option value="">-- Select State / UT --</option>';
    const states = Object.keys(INDIA_STATES_DATA).sort();
    states.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      stateSelect.appendChild(opt);
    });
  }

  const initialState = stateSelect.getAttribute('data-initial') || stateSelect.value || options.defaultState || 'Karnataka';
  if (initialState && Object.keys(INDIA_STATES_DATA).includes(initialState)) {
    stateSelect.value = initialState;
    updateCitiesList(initialState);
  }

  function updateCitiesList(selectedState) {
    if (!datalist) return;
    datalist.innerHTML = '';
    const cities = INDIA_STATES_DATA[selectedState] || [];
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      datalist.appendChild(opt);
    });

    if (quickCitiesContainer) {
      quickCitiesContainer.innerHTML = '';
      if (cities.length > 0) {
        const titleSpan = document.createElement('span');
        titleSpan.className = 'text-[10px] text-gray-400 font-semibold mr-1';
        titleSpan.textContent = 'Popular:';
        quickCitiesContainer.appendChild(titleSpan);

        cities.slice(0, 5).forEach(c => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'px-2 py-0.5 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] text-gray-600 transition font-medium border border-gray-200';
          btn.textContent = c;
          btn.onclick = () => {
            cityInput.value = c;
            cityInput.dispatchEvent(new Event('input'));
          };
          quickCitiesContainer.appendChild(btn);
        });
      }
    }
  }

  stateSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    updateCitiesList(selectedState);
  });

  let pincodeTimeout = null;
  pincodeInput.addEventListener('input', () => {
    const pin = pincodeInput.value.trim().replace(/\D/g, '');
    pincodeInput.value = pin;

    if (statusBadge) {
      statusBadge.innerHTML = '';
      statusBadge.className = 'pincode-status text-[11px] mt-1';
    }

    if (pin.length < 6) {
      if (pin.length > 0 && statusBadge) {
        statusBadge.innerHTML = '<span class="text-amber-600 font-semibold"><i class="fa-solid fa-spinner fa-spin text-[10px]"></i> 6 digits required</span>';
      }
      return;
    }

    if (pin.length > 6) {
      pincodeInput.value = pin.slice(0, 6);
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      if (statusBadge) {
        statusBadge.innerHTML = '<span class="text-red-600 font-bold"><i class="fa-solid fa-circle-xmark"></i> Invalid PIN (cannot start with 0)</span>';
      }
      return;
    }

    if (statusBadge) {
      statusBadge.innerHTML = '<span class="text-blue-600 font-semibold"><i class="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Verifying PIN code...</span>';
    }

    clearTimeout(pincodeTimeout);
    pincodeTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        
        if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
          const po = data[0].PostOffice[0];
          const resolvedState = po.State || po.Circle;
          const resolvedDistrict = po.District || po.Name;

          const matchedState = Object.keys(INDIA_STATES_DATA).find(
            s => s.toLowerCase() === (resolvedState || '').toLowerCase()
          );

          if (matchedState) {
            stateSelect.value = matchedState;
            updateCitiesList(matchedState);
          }

          if (resolvedDistrict) {
            cityInput.value = resolvedDistrict.trim();
          }

          data[0].PostOffice.forEach(item => {
            if (item.Name && !Array.from(datalist.options).some(o => o.value === item.Name)) {
              const opt = document.createElement('option');
              opt.value = item.Name;
              datalist.appendChild(opt);
            }
          });

          if (statusBadge) {
            statusBadge.innerHTML = `<span class="text-emerald-700 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check text-emerald-600"></i> Verified: ${resolvedDistrict}, ${matchedState || resolvedState}</span>`;
          }
        } else {
          handleFallbackPincode(pin);
        }
      } catch (err) {
        handleFallbackPincode(pin);
      }
    }, 250);
  });

  function handleFallbackPincode(pin) {
    const p2 = parseInt(pin.slice(0, 2), 10);
    const p3 = parseInt(pin.slice(0, 3), 10);
    const match = PINCODE_PREFIX_MAP.find(m => m.prefix.includes(p3) || m.prefix.includes(p2));

    if (match && INDIA_STATES_DATA[match.state]) {
      stateSelect.value = match.state;
      updateCitiesList(match.state);
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-location-dot"></i> Region: ${match.state} (PIN: ${pin})</span>`;
      }
    } else {
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Non-serviceable or invalid Indian PIN code</span>`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-indian-address]').forEach(form => {
    initIndianAddressForm(form);
  });
});
