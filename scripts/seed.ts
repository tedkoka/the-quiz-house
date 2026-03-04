import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("Seeding The Quiz House database...\n");

  // 1. Create a published quiz: "South African Trivia"
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: "South African Trivia",
      description:
        "Test your knowledge about the Rainbow Nation! From geography to culture, this quiz covers the essentials of South Africa.",
      category: "General Knowledge",
      price_cents: 0,
      time_per_question_seconds: 30,
      published: true,
    })
    .select()
    .single();

  if (quizError) {
    console.error("Error creating quiz:", quizError);
    process.exit(1);
  }

  console.log(`Created quiz: ${quiz.title} (${quiz.id})`);

  // 2. Create questions
  const questions = [
    {
      quiz_id: quiz.id,
      question_text: "What is the legislative capital of South Africa?",
      options: ["Pretoria", "Cape Town", "Johannesburg", "Bloemfontein"],
      correct_option_index: 1,
      order_index: 0,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "Which South African leader was awarded the Nobel Peace Prize in 1993?",
      options: [
        "Desmond Tutu",
        "F.W. de Klerk",
        "Nelson Mandela",
        "Both B and C",
      ],
      correct_option_index: 3,
      order_index: 1,
    },
    {
      quiz_id: quiz.id,
      question_text: "How many official languages does South Africa have?",
      options: ["9", "11", "13", "7"],
      correct_option_index: 1,
      order_index: 2,
    },
    {
      quiz_id: quiz.id,
      question_text: "What is the currency of South Africa?",
      options: ["Dollar", "Pound", "Rand", "Euro"],
      correct_option_index: 2,
      order_index: 3,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "Table Mountain is located in which South African city?",
      options: ["Durban", "Cape Town", "Pretoria", "Port Elizabeth"],
      correct_option_index: 1,
      order_index: 4,
    },
    {
      quiz_id: quiz.id,
      question_text:
        'What is the Afrikaans word for "barbecue", commonly used in South African English?',
      options: ["Biltong", "Braai", "Boerewors", "Bunny chow"],
      correct_option_index: 1,
      order_index: 5,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "Which ocean borders South Africa on the east coast?",
      options: [
        "Atlantic Ocean",
        "Indian Ocean",
        "Pacific Ocean",
        "Southern Ocean",
      ],
      correct_option_index: 1,
      order_index: 6,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "What is the name of the famous prison island where Nelson Mandela was held?",
      options: [
        "Alcatraz Island",
        "Robben Island",
        "Ellis Island",
        "Goree Island",
      ],
      correct_option_index: 1,
      order_index: 7,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "The Kruger National Park is one of Africa's largest game reserves. In which part of South Africa is it located?",
      options: ["Northwest", "Northeast", "Southwest", "Southeast"],
      correct_option_index: 1,
      order_index: 8,
    },
    {
      quiz_id: quiz.id,
      question_text:
        "Which South African golfer has won multiple major championships and is nicknamed 'The Black Knight'?",
      options: [
        "Ernie Els",
        "Gary Player",
        "Retief Goosen",
        "Louis Oosthuizen",
      ],
      correct_option_index: 1,
      order_index: 9,
    },
  ];

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(questions);

  if (questionsError) {
    console.error("Error creating questions:", questionsError);
    process.exit(1);
  }

  console.log(`Created ${questions.length} questions`);
  console.log("\nSeed complete!");
  console.log(
    "\nNote: To set a user as admin, run:"
  );
  console.log(
    `  UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';`
  );
}

seed().catch(console.error);
