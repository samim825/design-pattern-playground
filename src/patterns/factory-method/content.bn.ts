import type { DeepPartial } from '@/types/pattern'
import type { FactoryMethodContent } from './content.en'

// Technical terms stay in English (Factory Method, class, interface, override…).
// Anything missing here falls back to content.en.ts automatically.
export const bn: DeepPartial<FactoryMethodContent> = {
  title: 'Factory Method',
  tagline: 'কোন object তৈরি হবে, সেটা subclass ঠিক করুক। আর মূল কাজের ধাপগুলো সবার জন্য একই থাকুক।',
  intent:
    'Base class-এ object তৈরির জন্য একটা method রাখুন, আর প্রতিটা subclass সেটা override করে ঠিক করুক কোন concrete class-এর object বানানো হবে। Base class শুধু কমন interface-টা চেনে।',

  scenario: {
    title: 'তিন শাখার একটা কুরিয়ার কোম্পানি',
    paragraphs: [
      'মিতু তার ফেসবুক পেজে শাড়ি বিক্রি করে, আর সব অর্ডার পাঠায় সাথী কুরিয়ারে। পার্সেল বুকিংয়ের নিয়ম সবসময় একই: শাখা একটা গাড়ি ঠিক করে, ট্র্যাকিং নম্বর লেখে, পার্সেল পাঠায়, তারপর মিতুকে ফি আর ডেলিভারির সময় জানায়।',
      'গাড়িটা কী হবে, সেটা শাখার ওপর নির্ভর করে। ঢাকায় সরু গলি পেরিয়ে মিরপুরে যায় রিকশা-ভ্যান, খরচ ৳৬০। চট্টগ্রাম আগ্রাবাদে পাঠায় ট্রাকে, ৳১৫০। বরিশাল পার্সেল তুলে দেয় ভোলার লঞ্চে, ৳১২০।',
      'সামনের বছর সাথী কুরিয়ার সিলেটে একটা শাখা খুলতে চায়, যেটা চা-বাগানে ড্রোনে ডেলিভারি দেবে। বুকিংয়ের ধাপগুলো হুবহু একই থাকতে হবে। বদলাবে শুধু গাড়িটা।',
    ],
    problem:
      'বুকিংয়ের কোড যদি নিজেই "new RickshawVan()" বা "new Truck()" লেখে, তাহলে কোন শহর সেটা দেখে if/else দিয়ে বাছতে হয়। নতুন প্রতিটা শাখা মানেই সবার ব্যবহার করা বুকিং কোড আবার এডিট করা, আর প্রতিটা শহর আবার টেস্ট করা।',
  },

  visual: {
    // Pattern-role and class names stay in English on purpose.
    clientRole: 'Client',
    clientTitle: 'মিতুর পার্সেল ডেস্ক',
    parcel: 'শাড়ির পার্সেল',
    to: 'গন্তব্য',
    chooseBranch: 'কোন শাখা থেকে পাঠাবেন',
    dhaka: 'ঢাকা',
    chattogram: 'চট্টগ্রাম',
    barishal: 'বরিশাল',
    mirpur: 'মিরপুর',
    agrabad: 'আগ্রাবাদ',
    bhola: 'ভোলা',
    creatorRole: 'ConcreteCreator',
    creatorTag: 'Creator',
    extendsLabel: 'extends',
    sharedLabel: 'sendParcel(): inherit করা, সব শাখার জন্য একই',
    overrideLabel: 'createTransport(): এখানে override করা',
    stepCreate: 'একটা গাড়ি নেওয়া',
    stepBook: 'ট্র্যাকিং নম্বর লেখা',
    stepDeliver: 'পার্সেল পাঠানো',
    transportSlot: 'transport',
    notCreated: 'এখনো তৈরি হয়নি',
    productRole: 'ConcreteProduct',
    productTag: 'Product',
    implementsLabel: 'implements',
    waiting: 'createTransport()-এর অপেক্ষায়…',
    fee: 'ফি',
    eta: 'ডেলিভারি',
    etaDhaka: 'আজই',
    etaChattogram: 'আগামীকাল',
    etaBarishal: 'রাতারাতি',
    bookingTitle: 'বুকিং',
    tracking: 'ট্র্যাকিং',
    booked: 'বুকড',
    sendButton: 'পার্সেল পাঠান',
    whatsHappening: 'এখন কী ঘটছে',
    feeNote: 'সাথী কুরিয়ার আর এর ফি-গুলো শুধু উদাহরণের জন্য বানানো।',
  },

  steps: {
    idle: 'একটা শাখা বেছে নিয়ে “পার্সেল পাঠান” চাপুন। তিনটাই চালিয়ে দেখুন: বুকিংয়ের ধাপ কখনো বদলায় না, বদলায় শুধু createTransport() কোন গাড়ি বানাচ্ছে সেটা।',
    'pick-branch':
      'মিতু এখন {{branchClass}} থেকে পাঠাচ্ছে। তার কোড তবুও শুধু একটা CourierBranch দেখে, তাই তার কোডের আর কিছুই বদলাতে হয় না।',
    'client-send':
      'মিতু কল করছে branch.sendParcel()। শাড়িটা কোন গাড়িতে যাবে, সে জানে না। জানার দরকারও নেই।',
    'call-factory':
      'sendParcel() একবারই লেখা হয়েছে, CourierBranch-এ। তার একটা গাড়ি লাগবে, কিন্তু সে "new Truck()" লেখে না। বরং নিজের factory method কল করে: this.createTransport()।',
    create:
      '{{branchClass}} createTransport() override করে একটা নতুন {{productClass}} ফেরত দিচ্ছে। Concrete গাড়ির class কোনটা, সেটা শুধু এই এক লাইনই জানে।',
    book: 'আবার কমন কোডে ফেরা: শাখা ট্র্যাকিং নম্বর {{tracking}} লিখছে। এই ধাপটা সব শাখার জন্য হুবহু এক।',
    deliver:
      'sendParcel() কল করছে transport.deliver({{to}})। সে শুধু Transport interface-এর সাথে কথা বলে, তাই ভ্যান, ট্রাক বা লঞ্চ, সবার সাথেই একইভাবে কাজ করে।',
    drive: 'এবার {{productClass}}.deliver() নিজের মতো করে কাজ করছে: {{how}}',
    howDhaka: 'রিকশা-ভ্যান সরু গলি পেরিয়ে মিরপুরে যাচ্ছে।',
    howChattogram: 'ট্রাক হাইওয়ে ধরে আগ্রাবাদে যাচ্ছে।',
    howBarishal: 'লঞ্চ নদী বেয়ে ভোলায় যাচ্ছে।',
    done: 'হয়ে গেছে! মিতু বুকিং পেল: ফি {{fee}}, ডেলিভারি {{eta}}। এবার শাখা বদলে আবার চালান: একই sendParcel() থেকে আসবে অন্য গাড়ি।',
  },

  codeComments: {
    product: 'Product: প্রতিটা গাড়িকে এটুকু দিতেই হবে',
    creator: 'Creator: সবার জন্য কমন বুকিংয়ের ধাপ',
    factoryMethod: 'Factory method: কী তৈরি হবে, subclass ঠিক করে',
    shared: 'একবার লেখা, সব শাখা inherit করে',
    noNew: 'এখানে কোনো "new" নেই!',
    noConcrete: 'এখানে কোনো concrete class-এর নাম নেই!',
    concreteCreators: 'Concrete creator: প্রতিটা শাখা নিজের গাড়ি বেছে নেয়',
    usage: 'Client কোড',
    withoutIntro: 'বুকিং কোডকেই প্রতিটা শহরের গাড়ি বাছতে হচ্ছে',
    withoutTodo: 'ড্রোন নিয়ে সিলেট? আবার এই কমন ফাংশন এডিট করুন, আর সব শহর আবার টেস্ট করুন',
    withAdd: 'নতুন শাখা = একটা নতুন product + একটা নতুন creator। আর কিছু এডিট করতে হয় না।',
    withSame: 'sendParcel() যেমন ছিল তেমনই কাজে লাগছে',
  },

  compare: {
    without: {
      title: 'একটাই বুকিং ফাংশন, যে সব গাড়ি নিজে বানায়',
      points: [
        'বুকিং কোড প্রতিটা concrete গাড়ির class-এর ওপর নির্ভর করে।',
        'শহর দেখে if/else ঠিক করে কী বানানো হবে, আর প্রতিটা শাখার সাথে সেটা লম্বা হয়।',
        'সিলেট যোগ করা মানে সব শাখার ব্যবহার করা কমন কোড এডিট করা।',
        'বাকিগুলো না চালিয়ে একটা শাখাকে আলাদা করে টেস্ট করা কঠিন।',
      ],
    },
    with: {
      title: 'প্রতিটা শাখা createTransport() override করে',
      points: [
        'sendParcel() একবারই লেখা, আর সে শুধু Transport interface-টা চেনে।',
        'প্রতিটা শাখা এক লাইনের factory method-এ নিজের গাড়ি ঠিক করে।',
        'সিলেট যোগ করতে দুটো নতুন class লাগে, পুরনো কোনো class এডিট করতে হয় না।',
        'প্রতিটা শাখা আর গাড়ি আলাদা করে টেস্ট করা যায়।',
      ],
    },
    benefit:
      'Object তৈরির অংশটাই বদলায়, তাই সেটাকে একটা override-যোগ্য method-এ সরিয়ে রাখা হয়েছে। কমন কাজের ধাপগুলো বদলানোর জন্য বন্ধ (closed for modification), আর সেগুলো শুধু একটা interface-এর ওপর নির্ভর করে। নতুন subclass এসে নতুন product যোগ করে (open for extension)। এখানে Open/Closed Principle আর Dependency Inversion Principle একসাথে কাজ করছে।',
    whenToUse: [
      'Base class-এর কাজের ধাপ ঠিক করা, কিন্তু ভেতরের একটা object subclass অনুযায়ী আলাদা হওয়া দরকার।',
      'কমন কোডে if/else বা switch দিয়ে বেছে "new SomeClass()" লেখা হচ্ছে।',
      'পরে নতুন ধরন আসবে বলে মনে হচ্ছে (নতুন শাখা, ফাইল ফরম্যাট, ডেটাবেস বা UI theme), আর সেগুলো পুরনো কোডে হাত না দিয়ে যোগ করতে চান।',
    ],
  },
}
