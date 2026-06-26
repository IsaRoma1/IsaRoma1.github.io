const tabs = Array.from(document.querySelectorAll(".tab"));
const cards = Array.from(document.querySelectorAll(".menu-card"));
const searchInput = document.querySelector("#menuSearch");
const emptyState = document.querySelector("#emptyState");

let activeFilter = "all";

function normalize(value) {
  return value.toLocaleLowerCase("ru-RU").trim();
}

function applyMenuFilters() {
  const query = normalize(searchInput.value);
  let visibleCount = 0;

  cards.forEach((card) => {
    const categoryMatch = activeFilter === "all" || card.dataset.category === activeFilter;
    const haystack = normalize(`${card.textContent} ${card.dataset.search || ""}`);
    const searchMatch = !query || haystack.includes(query);
    const isVisible = categoryMatch && searchMatch;

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  emptyState.hidden = visibleCount !== 0;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeFilter = tab.dataset.filter;
    tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    applyMenuFilters();
  });
});

searchInput.addEventListener("input", applyMenuFilters);
