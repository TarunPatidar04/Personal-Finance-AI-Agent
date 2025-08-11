import readLine from "node:readline/promises";
import Groq from "groq-sdk";
const expenseDB = [];
const incomeDB = [];
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `you are josh,a personal finance assistant.Your Task is 
          to assist user with their expenses,balance and financial planning.
          You have access to following tools : 
          1. getTotalExpense({from,to}):string // Get a total expense for a time period
          2. addExpense({name,amount}):string // Add new expense to the expense database
          4. getMoneyBalance() // Get a remaining money balance from dataBase
          current datetime : ${new Date().toUTCString()}`,
    },
  ];

  // This is for user prompt loop
  while (true) {
    const question = await rl.question("USER : ");
    if (question === "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    // This is for Agent loop
    while (true) {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        tools: [
          {
            type: "function",
            function: {
              name: "getTotalExpense",
              description: "Get total expense from date to date",
              parameters: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description: "From date to get the expense",
                  },
                  to: {
                    type: "string",
                    description: "To date to get the expense",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addExpense",
              description: "Add new expense entry to the expense database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "name of the expense e.g, Bought an Iphone.",
                  },
                  amount: {
                    type: "string",
                    description: "amount of the expense",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addincome",
              description: "Add new Income entry to the Income database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "name of the Income. e.g, Got Salary",
                  },
                  amount: {
                    type: "string",
                    description: "amount of the Income",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "Get a remaining money balance from dataBase",
            },
          },
        ],
      });

      messages.push(completion.choices[0].message);

      const toolCalls = completion.choices[0].message.tool_calls;
      if (!toolCalls) {
        console.log(`Assistant : ${completion.choices[0].message.content}`);
        break;
      }

      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;

        let result = "";
        if (functionName === "getTotalExpense") {
          result = getTotalExpense(JSON.parse(functionArgs));
        }

        if (functionName === "addExpense") {
          result = addExpense(JSON.parse(functionArgs));
        }

        if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        }
        if (functionName === "getMoneyBalance") {
          result = getMoneyBalance(JSON.parse(functionArgs));
        }

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });
      }
    }
  }
  rl.close();
}

callAgent();

// get Total Expense Tool
function getTotalExpense({ from, to }) {
  // In Reality -> we call dataBase
  const expense = expenseDB.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);
  return `${expense} INR`;
}

function addExpense({ name, amount }) {
  expenseDB.push({ name, amount });
  return "Added to the database";
}

function addIncome({ name, amount }) {
  expenseDB.push({ name, amount });
  return "Added to the Income database";
}

function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = incomeDB.reduce((acc, item) => acc + item.amount, 0);
  return `${totalIncome - totalExpense} INR`;
}
