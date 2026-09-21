import os
import re

import pandas as pd
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction


User = get_user_model()


class Command(BaseCommand):
    help = "Import student users from an Excel file"

    def add_arguments(self, parser):
        parser.add_argument(
            "excel_file",
            type=str,
            help="Path to Excel file",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only check the data without saving anything",
        )

    def normalize_phone(self, value):
        if pd.isna(value):
            return ""

        value = str(value).strip()

        # حذف .0 که Excel گاهی به انتهای شماره اضافه می‌کند
        if value.endswith(".0"):
            value = value[:-2]

        # اعداد فارسی و عربی → انگلیسی
        translation = str.maketrans(
            "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
            "01234567890123456789",
        )

        value = value.translate(translation)

        # حذف فاصله، خط تیره و سایر کاراکترها
        value = re.sub(r"\D", "", value)

        # اگر با 98 شروع شده باشد
        if value.startswith("98") and len(value) == 12:
            value = "0" + value[2:]

        return value

    def clean_text(self, value):
        if pd.isna(value):
            return ""

        return str(value).strip()

    def handle(self, *args, **options):
        excel_file = options["excel_file"]
        dry_run = options["dry_run"]

        if not os.path.exists(excel_file):
            self.stderr.write(
                self.style.ERROR(
                    f"فایل پیدا نشد: {excel_file}"
                )
            )
            return

        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    f"خطا در خواندن Excel: {e}"
                )
            )
            return

        required_columns = [
            "شماره پرونده",
            "نام",
            "نام خانوادگی",
            "سطح",
            "تلفن",
            "همراه",
        ]

        missing = [
            column
            for column in required_columns
            if column not in df.columns
        ]

        if missing:
            self.stderr.write(
                self.style.ERROR(
                    "ستون‌های زیر در Excel پیدا نشدند:"
                )
            )

            for column in missing:
                self.stderr.write(f"  - {column}")

            return

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"فایل با موفقیت خوانده شد: {len(df)} رکورد"
            )
        )
        self.stdout.write(f"فایل: {excel_file}")
        self.stdout.write("")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "حالت DRY-RUN فعال است؛ هیچ تغییری در دیتابیس ایجاد نمی‌شود."
                )
            )
            self.stdout.write("")

        created = 0
        updated = 0
        skipped = 0
        errors = 0

        processed_usernames = set()

        for index, row in df.iterrows():

            excel_row = index + 2

            try:
                file_number = self.clean_text(
                    row["شماره پرونده"]
                )

                first_name = self.clean_text(
                    row["نام"]
                )

                last_name = self.clean_text(
                    row["نام خانوادگی"]
                )

                level = self.clean_text(
                    row["سطح"]
                )

                parent_phone = self.normalize_phone(
                    row["تلفن"]
                )

                student_phone = self.normalize_phone(
                    row["همراه"]
                )

                # Username و Password = شماره والدین
                username = parent_phone
                password = parent_phone

                if not username:
                    errors += 1

                    self.stdout.write(
                        self.style.ERROR(
                            f"ردیف {excel_row}: شماره والدین خالی است"
                        )
                    )

                    continue

                if not first_name or not last_name:
                    errors += 1

                    self.stdout.write(
                        self.style.ERROR(
                            f"ردیف {excel_row}: نام یا نام خانوادگی خالی است"
                        )
                    )

                    continue

                if len(username) < 10:
                    errors += 1

                    self.stdout.write(
                        self.style.ERROR(
                            f"ردیف {excel_row}: شماره والدین نامعتبر است: {username}"
                        )
                    )

                    continue

                # جلوگیری از تکرار شماره والدین در همان Excel
                if username in processed_usernames:
                    skipped += 1

                    self.stdout.write(
                        self.style.WARNING(
                            f"ردیف {excel_row}: شماره والدین تکراری در فایل: {username}"
                        )
                    )

                    continue

                processed_usernames.add(username)

                if dry_run:
                    exists = User.objects.filter(
                        username=username
                    ).exists()

                    if exists:
                        self.stdout.write(
                            self.style.WARNING(
                                f"[UPDATE] {first_name} {last_name} | {username}"
                            )
                        )
                        updated += 1
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"[CREATE] {first_name} {last_name} | {username}"
                            )
                        )
                        created += 1

                    continue

                with transaction.atomic():

                    user = User.objects.filter(
                        username=username
                    ).first()

                    if user:

                        # اگر کاربر قبلاً وجود دارد،
                        # اطلاعات دانش‌آموز را به‌روزرسانی می‌کنیم.
                        user.first_name = first_name
                        user.last_name = last_name
                        user.role = User.Role.STUDENT
                        user.phone_number = student_phone
                        user.parent_phone = parent_phone
                        user.level = level
                        user.plain_password = password

                        user.set_password(password)

                        user.save()

                        updated += 1

                        self.stdout.write(
                            self.style.WARNING(
                                f"به‌روزرسانی شد: "
                                f"{first_name} {last_name} "
                                f"| username={username}"
                            )
                        )

                    else:

                        user = User(
                            username=username,
                            first_name=first_name,
                            last_name=last_name,
                            role=User.Role.STUDENT,
                            phone_number=student_phone,
                            parent_phone=parent_phone,
                            level=level,
                            plain_password=password,
                        )

                        user.set_password(password)

                        user.save()

                        created += 1

                        self.stdout.write(
                            self.style.SUCCESS(
                                f"ایجاد شد: "
                                f"{first_name} {last_name} "
                                f"| username={username}"
                            )
                        )

            except Exception as e:
                errors += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"خطا در ردیف {excel_row}: {e}"
                    )
                )

        self.stdout.write("")
        self.stdout.write("=" * 50)
        self.stdout.write(
            self.style.SUCCESS(
                f"ایجاد شده: {created}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"به‌روزرسانی شده: {updated}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"رد شده: {skipped}"
            )
        )
        self.stdout.write(
            self.style.ERROR(
                f"خطادار: {errors}"
            )
        )
        self.stdout.write("=" * 50)