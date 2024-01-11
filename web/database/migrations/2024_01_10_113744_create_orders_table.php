<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('shop', 255);
            $table->string('shopify_id', 255);
            $table->string('name', 255);
            $table->integer('click_and_drop_id')->nullable();
            $table->string('channel_reference', 255);
            $table->decimal('subtotal', 9, 2);
            $table->decimal('shipping_cost_charged', 9 ,2);
            $table->decimal('total', 9 ,2);
            $table->string('currency_code', 255);
            $table->datetime('order_date');
            $table->text('recipient_name');
            $table->text('recipient_address1');
            $table->text('recipient_address2')->nullable();
            $table->text('recipient_city')->nullable();
            $table->text('recipient_county')->nullable();
            $table->text('recipient_postcode')->nullable();
            $table->text('recipient_country_code')->nullable();
            $table->text('billing_name');
            $table->text('billing_address1');
            $table->text('billing_address2')->nullable();
            $table->text('billing_city');
            $table->text('billing_postcode')->nullable();
            $table->text('billing_country_code')->nullable();
            $table->string('tracking_number', 255)->nullable();
            $table->boolean('fulfilled')->default(0);
            $table->longText('special_instructions')->nullable();
            $table->text('selected_shipping_method', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('orders');
    }
}
