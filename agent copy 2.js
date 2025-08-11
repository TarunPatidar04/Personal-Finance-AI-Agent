import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system",
      content: `you are josh,a personal finance assistant.Your Task is 
          to assist user with their expenses,balance and financial planning.
          current datetime : ${new Date().toUTCString()}`,
    },
  ];
  messages.push({
    role: "user",
    content: "how much money i have spent this month ?",
  });

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
    ],
  });

  console.log(JSON.stringify(completion.choices[0], null, 2));
  //   console.log(completion.choices[0]);
  messages.push(completion.choices[0].message);

  const toolCalls = completion.choices[0].message.tool_calls;
  if (!toolCalls) {
    console.log(`Assistant : ${completion.choices[0].message.content}`);
    return;
  }

  for (const tool of toolCalls) {
    const functionName = tool.function.name;
    const functionArgs = tool.function.arguments;

    let result = "";
    if (functionName === "getTotalExpense") {
      result = getTotalExpense(JSON.parse(functionArgs));
    }

    messages.push({
      role: "tool",
      content: result,
      tool_call_id: tool.id,
    });

    const completion2 = await groq.chat.completions.create({
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
      ],
    });

    console.log(JSON.stringify(completion2.choices[0], null, 2));
  }
  console.log(
    "==========================================================================="
  );
  console.log("Messages : ", messages);
}

callAgent();

// get Total Expense Tool
function getTotalExpense({ from, to }) {
  console.log("Calling getTotalExpense Tool");

  // In Reality -> we call dataBase
  return "10000 INR";
}
