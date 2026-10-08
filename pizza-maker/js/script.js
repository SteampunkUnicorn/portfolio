"use strict";

export function init(data) {
  const builder = document.querySelector(".pizza-builder");

  const navigation = builder.querySelector(".pizza-builder--navigation");

  const directions = builder.querySelector(".pizza-builder--game-directions");

  const builtPizza = builder.querySelector(".pizza-builder--built-pizza");
  const pan = builder.querySelector(".pizza-builder--pan");
  const pizzaToppings = builtPizza.querySelector(
    ".pizza-builder--pizza-toppings",
  );

  const completeButton = builder.querySelector(".pizza-builder--complete");

  const selections = new Map();

  // --------------------------------
  // Selection rules
  // --------------------------------

  const selectionLimits = {
    size: 1,
    crust: 1,
    sauce: 1,
    proteins: 3,
  };

  // --------------------------------
  // Step containers
  // --------------------------------

  const stepContainers = {
    size: ".pizza-builder--size",
    crust: ".pizza-builder--crust",
    sauce: ".pizza-builder--sauce",
    cheese: ".pizza-builder--cheese",
    proteins: ".pizza-builder--proteins",
    vegetables: ".pizza-builder--vegetables",
  };

  const sectionContainers = {
    size: ".pizza-builder--size",
    crust: ".pizza-builder--crust",
    sauce: ".pizza-builder--sauce",
    cheese: ".pizza-builder--cheese",
    proteins: ".pizza-builder--proteins",
    vegetables: ".pizza-builder--vegetables",
  };

  const doneSection = builder.querySelector(".pizza-builder--done");

  const ingredientList = builder.querySelector(
    ".pizza-builder--ingredient-list",
  );

  const nameForm = builder.querySelector(".pizza-builder--name-form");

  const nameInput = builder.querySelector(".pizza-builder--name-input");

  const pizzaName = builder.querySelector(".pizza-builder--pizza-name");

  const recipeCard = builder.querySelector(".pizza-builder--recipe-card");

  const recipeName = builder.querySelector(".pizza-builder--recipe-name");

  const recipeIngredients = builder.querySelector(
    ".pizza-builder--recipe-ingredients",
  );

  const recipePizza = builder.querySelector(".pizza-builder--recipe-pizza");

  // --------------------------------
  // Pizza visual state
  // --------------------------------

  const addPizzaVisual = (option, stepId) => {
    // Size changes the pan itself.
    if (stepId === "size") {
      pan.dataset.size = option.id;
      return;
    }

    // Crust is the foundation of the pizza.
    if (stepId === "crust") {
      builtPizza.dataset.crust = option.id;
      return;
    }

    // Everything else becomes an independent visual layer.
    const layer = document.createElement("div");

    layer.classList.add("pizza-builder--pizza-topping");

    layer.dataset.category = stepId;
    layer.dataset.ingredient = option.id;

    pizzaToppings.appendChild(layer);
  };

  const removePizzaVisual = (optionId, stepId) => {
    if (stepId === "size") {
      delete pan.dataset.size;
      return;
    }

    if (stepId === "crust") {
      delete builtPizza.dataset.crust;
      return;
    }

    const topping = pizzaToppings.querySelector(
      `.pizza-builder--pizza-topping[data-category="${stepId}"][data-ingredient="${optionId}"]`,
    );

    topping?.remove();
  };

  // --------------------------------
  // Sync UI controls
  // --------------------------------

  const updateOptionState = (optionId, stepId, isSelected) => {
    const optionButton = builder.querySelector(
      `.pizza-builder--option[data-option-id="${optionId}"][data-step-id="${stepId}"]`,
    );

    if (optionButton) {
      optionButton.classList.toggle("is-selected", isSelected);
    }

    const selectOption = builder.querySelector(
      `.pizza-builder--option-select[data-step-id="${stepId}"] option[value="${optionId}"]`,
    );

    if (selectOption) {
      selectOption.disabled = isSelected;
    }
  };

  // --------------------------------
  // Add ingredient
  // --------------------------------

  const addIngredient = (option, stepId, optionElement = null) => {
    let stepSelections = selections.get(stepId) || [];

    const limit = selectionLimits[stepId];

    // Ingredient can only be selected once.
    if (stepSelections.includes(option.id)) {
      return;
    }

    // Multi-choice categories stop at their limit.
    if (limit && limit > 1 && stepSelections.length >= limit) {
      return;
    }

    // Single-choice categories replace their current selection.
    if (limit === 1 && stepSelections.length) {
      const previousOptionId = stepSelections[0];

      removeIngredient(previousOptionId, stepId);

      // removeIngredient() replaces the array stored in the Map,
      // so grab the new array before adding the new selection.
      stepSelections = selections.get(stepId) || [];
    }

    stepSelections.push(option.id);

    selections.set(stepId, stepSelections);

    updateOptionState(option.id, stepId, true);

    addPizzaVisual(option, stepId);

    updateCompleteButton();

    if (limit && stepSelections.length === limit) {
      goToNextStep(stepId);
    }
  };

  // --------------------------------
  // Remove ingredient
  // --------------------------------

  const removeIngredient = (optionId, stepId) => {
    const stepSelections = selections.get(stepId) || [];

    const updatedSelections = stepSelections.filter((id) => id !== optionId);

    selections.set(stepId, updatedSelections);

    updateOptionState(optionId, stepId, false);

    removePizzaVisual(optionId, stepId);

    updateCompleteButton();
  };

  // --------------------------------
  // Drag ingredient
  // --------------------------------

  const startIngredientDrag = (event, option, optionElement) => {
    if (!event.isPrimary) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;

    let dragging = false;
    let dragClone = null;

    const startDragging = () => {
      dragging = true;

      dragClone = optionElement.cloneNode(true);

      dragClone.classList.add("pizza-builder--dragging");

      dragClone.setAttribute("aria-hidden", "true");

      document.body.appendChild(dragClone);
    };

    const moveClone = (moveEvent) => {
      if (!dragClone) {
        return;
      }

      dragClone.style.left = `${moveEvent.clientX}px`;

      dragClone.style.top = `${moveEvent.clientY}px`;
    };

    const handlePointerMove = (moveEvent) => {
      const distanceX = moveEvent.clientX - startX;

      const distanceY = moveEvent.clientY - startY;

      const distance = Math.hypot(distanceX, distanceY);

      if (!dragging && distance > 8) {
        startDragging();
      }

      if (!dragging) {
        return;
      }

      moveEvent.preventDefault();

      moveClone(moveEvent);

      const dropTarget = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY,
      );

      const overPizza = dropTarget && builtPizza.contains(dropTarget);

      builtPizza.classList.toggle("is-drag-over", overPizza);
    };

    const handlePointerUp = (upEvent) => {
      if (dragging) {
        const dropTarget = document.elementFromPoint(
          upEvent.clientX,
          upEvent.clientY,
        );

        if (dropTarget && builtPizza.contains(dropTarget)) {
          addIngredient(option, optionElement.dataset.stepId, optionElement);
        }
      }

      dragClone?.remove();

      builtPizza.classList.remove("is-drag-over");

      document.removeEventListener("pointermove", handlePointerMove);

      document.removeEventListener("pointerup", handlePointerUp);

      document.removeEventListener("pointercancel", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });

    document.addEventListener("pointerup", handlePointerUp);

    document.addEventListener("pointercancel", handlePointerUp);
  };

  // --------------------------------
  // Desktop option
  // --------------------------------

  const createOption = (option, step) => {
    const optionElement = document.createElement("button");

    optionElement.type = "button";

    optionElement.classList.add("pizza-builder--option");

    optionElement.dataset.optionId = option.id;

    optionElement.dataset.stepId = step.id;

    optionElement.setAttribute("aria-label", `${option.label}. Add to pizza`);

    optionElement.innerHTML = `
      <span class="pizza-builder--option-label">
        ${option.label}
      </span>

      <span class="pizza-builder--option-description">
        ${option.description}
      </span>
    `;

    optionElement.addEventListener("click", () => {
      const stepSelections = selections.get(step.id) || [];

      // Clicking an already-selected option
      // removes it.
      if (stepSelections.includes(option.id)) {
        removeIngredient(option.id, step.id);

        return;
      }

      addIngredient(option, step.id, optionElement);
    });

    // Dragging is desktop/fine-pointer only.
    if (window.matchMedia("(pointer: fine)").matches) {
      optionElement.addEventListener("pointerdown", (event) => {
        startIngredientDrag(event, option, optionElement);
      });
    }

    return optionElement;
  };

  // --------------------------------
  // Mobile select
  // --------------------------------

  const createOptionSelect = (step) => {
    const select = document.createElement("select");

    select.classList.add("pizza-builder--option-select");

    select.dataset.stepId = step.id;

    const placeholder = document.createElement("option");

    placeholder.value = "";

    placeholder.textContent = `Choose ${step.label}`;

    select.appendChild(placeholder);

    step.options?.forEach((option) => {
      const selectOption = document.createElement("option");

      selectOption.value = option.id;

      selectOption.textContent = option.label;

      select.appendChild(selectOption);
    });

    select.addEventListener("change", () => {
      const option = step.options?.find((item) => item.id === select.value);

      if (!option) {
        return;
      }

      addIngredient(option, step.id);

      select.value = "";
    });

    return select;
  };

  // --------------------------------
  // Regular step
  // --------------------------------

  const createRegularStep = (step, container) => {
    container.innerHTML = `
      <h2>${step.label}</h2>

      <p class="pizza-builder--step-description">
        ${step.description}
      </p>
    `;

    const select = createOptionSelect(step);

    const optionsContainer = document.createElement("div");

    optionsContainer.classList.add("pizza-builder--options");

    step.options?.forEach((option) => {
      const optionElement = createOption(option, step);

      optionsContainer.appendChild(optionElement);
    });

    container.append(select, optionsContainer);
  };

  // --------------------------------
  // Create step
  // --------------------------------

  const createStep = (step) => {
    const containerSelector = stepContainers[step.id];

    if (!containerSelector) {
      return;
    }

    const container = builder.querySelector(containerSelector);

    if (!container) {
      return;
    }

    createRegularStep(step, container);
  };

  // --------------------------------
  // Navigation
  // --------------------------------

  const scrollActiveNavItem = (navItem) => {
    if (!window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );

    const gap = rootFontSize * 0.5;

    navigation.scrollTo({
      left: navItem.offsetLeft - gap,

      behavior: "smooth",
    });
  };

  const showStep = (stepId) => {
    const sections = builder.querySelectorAll(
      ".pizza-builder--ingredient-section",
    );

    sections.forEach((section) => {
      section.classList.remove("is-active");
    });

    const targetSelector = sectionContainers[stepId];

    const targetSection = builder.querySelector(targetSelector);

    if (targetSection) {
      targetSection.classList.add("is-active");
    }

    const navItems = navigation.querySelectorAll(".pizza-builder--nav-item");

    navItems.forEach((navItem) => {
      const isActive = navItem.dataset.stepId === stepId;

      navItem.classList.toggle("is-active", isActive);

      if (isActive) {
        scrollActiveNavItem(navItem);
      }
    });

    const currentStep = data.steps.find((step) => step.id === stepId);
  };

  const goToNextStep = (currentStepId) => {
    const navItems = [
      ...navigation.querySelectorAll(".pizza-builder--nav-item"),
    ];

    const currentIndex = navItems.findIndex(
      (navItem) => navItem.dataset.stepId === currentStepId,
    );

    const nextNavItem = navItems[currentIndex + 1];

    if (nextNavItem) {
      showStep(nextNavItem.dataset.stepId);
    }
  };

  const createNavButton = (stepId, label) => {
    const button = document.createElement("button");

    button.type = "button";

    button.classList.add(
      "pizza-builder--nav-item",
      `pizza-builder--nav-item-${stepId}`,
    );

    button.dataset.stepId = stepId;

    button.innerHTML = `
      <span class="pizza-builder--nav-label">
        ${label}
      </span>
    `;

    button.addEventListener("click", () => {
      showStep(stepId);
    });

    navigation.appendChild(button);
  };

  const createNavigation = () => {
    data.steps.forEach((step) => {
      if (step.id === "name") {
        return;
      }

      // Ignore steps that aren't part of the builder UI.
      if (!stepContainers[step.id]) {
        return;
      }

      createNavButton(step.id, step.label);
    });
  };

  const createIngredientSummary = () => {
    ingredientList.innerHTML = "";

    data.steps.forEach((step) => {
      if (step.id === "size" || step.id === "name") {
        return;
      }

      const selectedIds = selections.get(step.id) || [];

      selectedIds.forEach((optionId) => {
        const option = step.options?.find((item) => item.id === optionId);

        if (!option) {
          return;
        }

        const item = document.createElement("li");

        item.classList.add("pizza-builder--ingredient-list-item");

        item.textContent = option.label;

        ingredientList.appendChild(item);
      });
    });
  };

  // --------------------------------
  // Complete pizza
  // --------------------------------

  const updateCompleteButton = () => {
    const requiredSteps = ["size", "crust", "sauce", "cheese"];

    const hasRequiredIngredients = requiredSteps.every((stepId) => {
      const stepSelections = selections.get(stepId) || [];

      return stepSelections.length > 0;
    });

    completeButton.hidden = !hasRequiredIngredients;
  };

  completeButton.addEventListener("click", () => {
    const sections = builder.querySelectorAll(
      ".pizza-builder--ingredient-section",
    );

    sections.forEach((section) => {
      section.classList.remove("is-active");
    });

    navigation
      .querySelectorAll(".pizza-builder--nav-item")
      .forEach((navItem) => {
        navItem.classList.remove("is-active");
      });

    completeButton.hidden = true;

    createIngredientSummary();

    doneSection.classList.add("is-active");

    nameInput.focus();
  });

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
      nameInput.focus();
      return;
    }

    pizzaName.textContent = name;

    // Get positions before changing anything.
    const inputRect = nameInput.getBoundingClientRect();
    const labelRect = doneSection
      .querySelector(".pizza-builder--done_label")
      .getBoundingClientRect();

    // Position the title exactly where the input text begins.
    pizzaName.style.left = `${
      inputRect.left -
      labelRect.left +
      parseFloat(getComputedStyle(nameInput).paddingLeft)
    }px`;

    pizzaName.style.top = `${
      inputRect.top -
      labelRect.top +
      parseFloat(getComputedStyle(nameInput).paddingTop)
    }px`;

    // Make it available for animation.
    pizzaName.hidden = false;

    // Force the browser to establish the starting state.
    requestAnimationFrame(() => {
      nameForm.classList.add("is-complete");
      pizzaName.classList.add("is-visible");
    });

    nameForm.addEventListener(
      "transitionend",
      (event) => {
        if (event.propertyName !== "opacity") {
          return;
        }

        nameForm.hidden = true;
      },
      { once: true },
    );
  });

  const createRecipeCard = () => {
    // Pizza name
    recipeName.textContent = pizzaName.textContent;

    // Ingredient list
    recipeIngredients.innerHTML = "";

    data.steps.forEach((step) => {
      if (step.id === "name") {
        return;
      }

      const selectedIds = selections.get(step.id) || [];

      selectedIds.forEach((optionId) => {
        const option = step.options?.find((item) => item.id === optionId);

        if (!option) {
          return;
        }

        const item = document.createElement("li");

        item.textContent = option.label;

        recipeIngredients.appendChild(item);
      });
    });

    // Copy the finished pizza into the recipe card.
    recipePizza.innerHTML = "";

    const pizzaClone = builtPizza.cloneNode(true);

    recipePizza.appendChild(pizzaClone);
  };

  // --------------------------------
  // Initialize
  // --------------------------------

  const initPizzaBuilder = () => {
    data.steps.forEach((step) => {
      createStep(step);
    });

    createNavigation();

    updateCompleteButton();

    const firstStep = data.steps.find((step) => step.id !== "name");

    if (firstStep) {
      showStep(firstStep.id);
    }
  };

  initPizzaBuilder();
}
