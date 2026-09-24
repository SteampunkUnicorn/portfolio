"use strict";

export function init(data) {
  const builder = document.querySelector(".pizza-builder");
  const navigation = builder.querySelector(".pizza-builder--navigation");
  const directions = builder.querySelector(".pizza-builder--game-directions");

  const stepContainers = {
    size: ".pizza-builder--size",
    crust: ".pizza-builder--crust",
    sauce: ".pizza-builder--sauce",
    cheese: ".pizza-builder--cheese",
    proteins: ".pizza-builder--proteins",
    vegetables: ".pizza-builder--vegetables",
    "crust-seasoning": ".pizza-builder--crust-seasons",
    "fresh-finishes": ".pizza-builder--fresh-finishes",
    drizzle: ".pizza-builder--drizzle",
  };

  const createOption = (option, step) => {
    const optionElement = document.createElement("button");

    optionElement.classList.add("pizza-builder--option");
    optionElement.dataset.optionId = option.id;
    optionElement.type = "button";

    optionElement.innerHTML = `
    <span class="pizza-builder--option-label">
      ${option.label}
    </span>

    <span class="pizza-builder--option-description">
      ${option.description}
    </span>
  `;

    return optionElement;
  };

  const createStep = (step) => {
    const containerSelector = stepContainers[step.id];
    const container = builder.querySelector(containerSelector);

    if (!container) return;

    container.innerHTML = `
    <h2>${step.label}</h2>
    <p class="pizza-builder--step-description">
      ${step.description}
    </p>

    <div class="pizza-builder--options"></div>
  `;

    const optionsContainer = container.querySelector(".pizza-builder--options");

    step.options?.forEach((option) => {
      const optionElement = createOption(option, step);
      optionsContainer.appendChild(optionElement);
    });
  };

  const createNavigation = () => {
    data.steps.forEach((step, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.classList.add("pizza-builder--nav-item");
      button.dataset.stepId = step.id;

      button.innerHTML = `
      <span class="pizza-builder--nav-number">
        ${index + 1}
      </span>
      <span class="pizza-builder--nav-label">
        ${step.label}
      </span>
    `;

      navigation.appendChild(button);
    });
  };

  const createDirections = () => {
    const firstStep = data.steps[0];

    directions.textContent = firstStep.description;
  };

  const initPizzaBuilder = () => {
    createNavigation();

    data.steps.forEach((step) => {
      createStep(step);
    });

    createDirections();
  };

  initPizzaBuilder();
}
