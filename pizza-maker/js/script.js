"use strict";

export function init(data) {
  const builder = document.querySelector(".pizza-builder");
  const navigation = builder.querySelector(".pizza-builder--navigation");
  const directions = builder.querySelector(".pizza-builder--game-directions");
  const builtPizza = builder.querySelector(".pizza-builder--built-pizza");
  const builtPizzaList = builtPizza.querySelector("ul");
  const completeButton = builder.querySelector(".pizza-builder--complete");

  const selections = new Map();

  // Map JSON IDs to the containers to be rendered. Include limits
  const selectionLimits = {
    size: 1,
    crust: 1,
    sauce: 1,
    proteins: 3,
  };

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

  //  Map nav IDs to sections
  const sectionContainers = {
    size: ".pizza-builder--size",
    crust: ".pizza-builder--crust",
    sauce: ".pizza-builder--sauce",
    cheese: ".pizza-builder--cheese",
    proteins: ".pizza-builder--proteins",
    vegetables: ".pizza-builder--vegetables",
    extras: ".pizza-builder--extras",
  };

  const addIngredient = (option, stepId, optionElement) => {
    // Allow once.
    if (optionElement.classList.contains("is-selected")) {
      return;
    }
    const stepSelections = selections.get(stepId) || [];
    const limit = selectionLimits[stepId];

    if (limit && stepSelections.length >= limit) {
      return;
    }

    stepSelections.push(option.id);
    selections.set(stepId, stepSelections);
    updateCompleteButton();
    optionElement.classList.add("is-selected");

    const listItem = document.createElement("li");

    listItem.classList.add("pizza-builder--built-ingredient");
    listItem.dataset.optionId = option.id;
    listItem.dataset.stepId = stepId;

    const label = document.createElement("span");

    label.classList.add("pizza-builder--built-ingredient-label");
    label.textContent = option.label;

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.classList.add("pizza-builder--remove-ingredient");
    removeButton.setAttribute(
      "aria-label",
      `Remove ${option.label} from pizza`,
    );

    removeButton.textContent = "×";

    removeButton.addEventListener("click", () => {
      removeIngredient(option.id, stepId, listItem);
    });

    listItem.append(label, removeButton);

    builtPizzaList.appendChild(listItem);

    //  Auto move to the next navigation step.
    if (limit && stepSelections.length === limit) {
      goToNextStep(stepId);
    }
  };

  const removeIngredient = (optionId, stepId, listItem) => {
    const stepSelections = selections.get(stepId) || [];
    const updatedSelections = stepSelections.filter((id) => id !== optionId);
    selections.set(stepId, updatedSelections);
    updateCompleteButton();
    const optionElement = builder.querySelector(
      `.pizza-builder--option[data-option-id="${optionId}"][data-step-id="${stepId}"]`,
    );

    if (optionElement) {
      optionElement.classList.remove("is-selected");
    }

    listItem.remove();
  };

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

    const moveClone = (event) => {
      if (!dragClone) {
        return;
      }

      dragClone.style.left = `${event.clientX}px`;
      dragClone.style.top = `${event.clientY}px`;
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

  // Steps to displayed together as Extras
  const extraSteps = ["crust-seasoning", "fresh-finishes", "drizzle"];

  // Individual ingredient options.
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
      addIngredient(option, step.id, optionElement);
    });

    optionElement.addEventListener("pointerdown", (event) => {
      startIngredientDrag(event, option, optionElement);
    });

    return optionElement;
  };

  const createStep = (step) => {
    const containerSelector = stepContainers[step.id];

    if (!containerSelector) {
      return;
    }

    const container = builder.querySelector(containerSelector);

    if (!container) {
      return;
    }

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

  const scrollActiveNavItem = (navItem) => {
    if (!window.matchMedia("(max-width: 768px)").matches) {
      return;
    }

    const gap =
      parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.5;

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

    if (stepId === "extras") {
      directions.textContent = "Add the finishing touches to your pizza.";

      return;
    }

    const currentStep = data.steps.find((step) => step.id === stepId);

    if (currentStep) {
      directions.textContent = currentStep.description;
    }
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

  const createNavButton = (stepId, label, index) => {
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
    let navIndex = 0;
    let extrasCreated = false;

    data.steps.forEach((step) => {
      if (step.id === "name") {
        return;
      }

      if (extraSteps.includes(step.id)) {
        if (!extrasCreated) {
          navIndex++;

          createNavButton("extras", "Extras", navIndex);

          extrasCreated = true;
        }

        return;
      }

      navIndex++;

      createNavButton(step.id, step.label, navIndex);
    });
  };

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

    directions.textContent = "Every legend needs a name.";

    builder.querySelector(".pizza-builder--done").classList.add("is-active");
  });

  const initPizzaBuilder = () => {
    data.steps.forEach((step) => {
      createStep(step);
    });
    createNavigation();

    const firstStep = data.steps[0];

    if (firstStep) {
      showStep(firstStep.id);
    }
  };

  initPizzaBuilder();
}
